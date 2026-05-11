"""
utils/aggregation.py
---------------------
Usage log aggregation helpers used by the analytics routes.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from typing import Optional


def total_usage_by_ingredient(
    session,
    days: Optional[int] = None,
) -> dict[str, float]:
    """
    Aggregate total quantity consumed per ingredient.

    Args:
        session: Active SQLAlchemy session.
        days:    If set, only include logs from the last N days.

    Returns:
        {ingredient_name: total_quantity}
    """
    from backend.models import Ingredient, UsageLog

    query = session.query(UsageLog).filter(UsageLog.quantity.isnot(None))
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query  = query.filter(UsageLog.logged_at >= cutoff)

    totals: dict[str, float] = defaultdict(float)
    for log in query.all():
        ing = session.query(Ingredient).filter_by(id=log.ingredient_id).first()
        if ing:
            totals[ing.name] += log.quantity or 0.0

    return dict(totals)


def usage_by_chef(
    session,
    days: Optional[int] = None,
) -> dict[str, dict[str, float]]:
    """
    Break down usage per chef, then per ingredient.

    Returns:
        {chef_name: {ingredient_name: total_quantity}}
    """
    from backend.models import Ingredient, UsageLog

    query = session.query(UsageLog).filter(UsageLog.quantity.isnot(None))
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query  = query.filter(UsageLog.logged_at >= cutoff)

    breakdown: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for log in query.all():
        ing = session.query(Ingredient).filter_by(id=log.ingredient_id).first()
        if ing:
            breakdown[log.chef_name][ing.name] += log.quantity or 0.0

    return {chef: dict(items) for chef, items in breakdown.items()}


def recent_activity(session, limit: int = 20) -> list[dict]:
    """
    Return the most recent usage log entries for the activity feed.
    """
    from backend.models import Ingredient, UsageLog

    logs = (
        session.query(UsageLog)
        .order_by(UsageLog.logged_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for log in logs:
        ing = session.query(Ingredient).filter_by(id=log.ingredient_id).first()
        result.append({
            "id":             log.id,
            "ingredient":     ing.name if ing else "unknown",
            "chef_name":      log.chef_name,
            "manager_name":   log.manager_name,
            "quantity":       log.quantity,
            "unit":           log.unit,
            "confidence":     log.confidence,
            "mapping_method": log.mapping_method,
            "needs_review":   log.needs_review,
            "raw_text":       log.raw_text,
            "logged_at":      log.logged_at.isoformat() if log.logged_at else None,
        })
    return result


def daily_usage_timeline(
    session,
    days: int = 30,
    ingredient_name: Optional[str] = None,
) -> list[dict]:
    """
    Return daily aggregated usage over the last N days.

    Args:
        session:          Active SQLAlchemy session.
        days:             Number of days to look back.
        ingredient_name:  Filter to one ingredient, or None for all.

    Returns:
        List of {date: str, quantity: float} sorted ascending.
    """
    from backend.models import Ingredient, UsageLog

    cutoff = datetime.utcnow() - timedelta(days=days)
    query  = session.query(UsageLog).filter(
        UsageLog.quantity.isnot(None),
        UsageLog.logged_at >= cutoff,
    )

    if ingredient_name:
        ing = session.query(Ingredient).filter_by(name=ingredient_name).first()
        if ing:
            query = query.filter(UsageLog.ingredient_id == ing.id)

    daily: dict[str, float] = defaultdict(float)
    for log in query.all():
        day = log.logged_at.strftime("%Y-%m-%d")
        daily[day] += log.quantity or 0.0

    # Fill in zeros for missing days
    today  = datetime.utcnow().date()
    result = []
    for i in range(days, 0, -1):
        day_label = (today - timedelta(days=i - 1)).isoformat()
        result.append({"date": day_label, "quantity": round(daily.get(day_label, 0.0), 4)})

    return result


def usage_by_category(
    session,
    days: Optional[int] = None,
) -> dict[str, float]:
    """
    Return total usage grouped by ingredient category.

    Returns:
        {category: total_quantity}
    """
    from backend.models import Ingredient, UsageLog

    query = session.query(UsageLog).filter(UsageLog.quantity.isnot(None))
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query  = query.filter(UsageLog.logged_at >= cutoff)

    by_cat: dict[str, float] = defaultdict(float)
    for log in query.all():
        ing = session.query(Ingredient).filter_by(id=log.ingredient_id).first()
        if ing:
            by_cat[ing.category] += log.quantity or 0.0

    return dict(by_cat)


def dashboard_summary(session) -> dict:
    """
    Compute KPI values for the dashboard summary card.

    Returns dict with:
        total_entries, mapped_entries, unmapped_entries,
        accuracy_rate, unique_chefs, top_ingredient, alert_count
    """
    from backend.models import Ingredient, Inventory, UnmappedEntry, UsageLog

    total_entries   = session.query(UsageLog).count()
    unmapped_count  = session.query(UnmappedEntry).filter_by(mapped_at=None).count()
    mapped_entries  = total_entries  # usage_logs are always mapped
    total_attempts  = total_entries + unmapped_count
    accuracy_rate   = round((mapped_entries / total_attempts * 100) if total_attempts else 0.0, 1)

    # Unique chefs
    chefs = session.query(UsageLog.chef_name).distinct().all()
    unique_chefs = len(chefs)

    # Top ingredient by total usage
    from collections import Counter
    usage_count: Counter = Counter()
    for log in session.query(UsageLog).filter(UsageLog.quantity.isnot(None)).all():
        ing = session.query(Ingredient).filter_by(id=log.ingredient_id).first()
        if ing:
            usage_count[ing.name] += log.quantity or 0.0
    top_ingredient = usage_count.most_common(1)[0][0] if usage_count else None

    # Alert count
    alert_count = 0
    for inv in session.query(Inventory).all():
        if inv.current_stock <= inv.reorder_threshold:
            alert_count += 1

    return {
        "total_entries":   total_entries,
        "mapped_entries":  mapped_entries,
        "unmapped_count":  unmapped_count,
        "accuracy_rate":   accuracy_rate,
        "unique_chefs":    unique_chefs,
        "top_ingredient":  top_ingredient,
        "alert_count":     alert_count,
    }


def chef_usage_detail(session, days: int = 1) -> dict:
    """
    Detailed breakdown for Chef Usage Overview.
    """
    from backend.models import Ingredient, UsageLog, Inventory
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() - timedelta(days=days)
    logs = session.query(UsageLog).filter(UsageLog.logged_at >= cutoff).all()

    # Summary
    active_chefs = len(set(l.chef_name for l in logs))
    total_items_used = len(set(l.ingredient_id for l in logs))
    total_quantity_used = sum(l.quantity or 0.0 for l in logs)
    
    low_stock_ids = [inv.ingredient_id for inv in session.query(Inventory).all() if inv.current_stock <= inv.reorder_threshold]
    today_ing_ids = set(l.ingredient_id for l in logs)
    low_stock_affected = len(today_ing_ids.intersection(low_stock_ids))

    # Chef breakdown
    chef_data = defaultdict(lambda: {
        "chef_name": "",
        "status": "Active",
        "total_quantity_used": 0.0,
        "items_count": 0,
        "last_activity": "",
        "items": [],
        "unique_ing_ids": set()
    })

    # Sort logs by time desc for last activity
    sorted_logs = sorted(logs, key=lambda x: x.logged_at, reverse=True)

    for log in sorted_logs:
        ing = session.query(Ingredient).filter_by(id=log.ingredient_id).first()
        inv = session.query(Inventory).filter_by(ingredient_id=log.ingredient_id).first()
        
        c = chef_data[log.chef_name]
        c["chef_name"] = log.chef_name
        c["total_quantity_used"] += log.quantity or 0.0
        c["unique_ing_ids"].add(log.ingredient_id)
        
        if not c["last_activity"]:
            c["last_activity"] = log.logged_at.strftime("%I:%M %p")

        c["items"].append({
            "ingredient": ing.name if ing else "unknown",
            "quantity_used": round(log.quantity or 0.0, 2),
            "unit": log.unit or "",
            "time": log.logged_at.strftime("%I:%M %p"),
            "remaining_stock": round(inv.current_stock if inv else 0.0, 2)
        })

    formatted_chefs = []
    for chef_name in sorted(chef_data.keys()):
        data = chef_data[chef_name]
        data["items_count"] = len(data["unique_ing_ids"])
        data["total_quantity_used"] = round(data["total_quantity_used"], 2)
        del data["unique_ing_ids"]
        formatted_chefs.append(data)

    return {
        "summary": {
            "active_chefs": active_chefs,
            "total_items_used": total_items_used,
            "total_quantity_used": round(total_quantity_used, 2),
            "low_stock_affected": low_stock_affected
        },
        "chefs": formatted_chefs
    }
