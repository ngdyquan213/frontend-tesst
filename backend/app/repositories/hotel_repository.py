from datetime import date, timedelta

from sqlalchemy import asc, desc
from sqlalchemy.orm import Session, joinedload

from app.models.hotel import Hotel, HotelRoom, HotelRoomInventory


class HotelRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    @staticmethod
    def _stay_dates(check_in_date: date, check_out_date: date) -> list[date]:
        nights = (check_out_date - check_in_date).days
        return [check_in_date + timedelta(days=offset) for offset in range(nights)]

    def list_hotels(
        self,
        skip: int = 0,
        limit: int = 20,
        city: str | None = None,
        country: str | None = None,
        min_star_rating: int | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> list[Hotel]:
        query = self.db.query(Hotel).options(joinedload(Hotel.rooms))

        if city:
            query = query.filter(Hotel.city.ilike(f"%{city}%"))

        if country:
            query = query.filter(Hotel.country.ilike(f"%{country}%"))

        if min_star_rating is not None:
            query = query.filter(Hotel.star_rating >= min_star_rating)

        sort_column = {
            "name": Hotel.name,
            "city": Hotel.city,
            "star_rating": Hotel.star_rating,
        }.get(sort_by, Hotel.name)

        order_clause = asc(sort_column) if sort_order == "asc" else desc(sort_column)

        return query.order_by(order_clause).offset(skip).limit(limit).all()

    def count_hotels(
        self,
        city: str | None = None,
        country: str | None = None,
        min_star_rating: int | None = None,
    ) -> int:
        query = self.db.query(Hotel)

        if city:
            query = query.filter(Hotel.city.ilike(f"%{city}%"))

        if country:
            query = query.filter(Hotel.country.ilike(f"%{country}%"))

        if min_star_rating is not None:
            query = query.filter(Hotel.star_rating >= min_star_rating)

        return query.count()

    def get_by_id(self, hotel_id: str) -> Hotel | None:
        return (
            self.db.query(Hotel)
            .options(joinedload(Hotel.rooms))
            .filter(Hotel.id == hotel_id)
            .first()
        )

    def get_room_by_id(self, room_id: str) -> HotelRoom | None:
        return self.db.query(HotelRoom).filter(HotelRoom.id == room_id).first()

    def get_room_by_id_for_update(self, room_id: str) -> HotelRoom | None:
        return self.db.query(HotelRoom).filter(HotelRoom.id == room_id).with_for_update().first()

    def save_room(self, room: HotelRoom) -> HotelRoom:
        self.db.add(room)
        self.db.flush()
        return room

    def get_room_inventories_for_update(
        self,
        *,
        room_id: str,
        check_in_date: date,
        check_out_date: date,
    ) -> list[HotelRoomInventory]:
        return (
            self.db.query(HotelRoomInventory)
            .filter(
                HotelRoomInventory.room_id == room_id,
                HotelRoomInventory.inventory_date >= check_in_date,
                HotelRoomInventory.inventory_date < check_out_date,
            )
            .with_for_update()
            .all()
        )

    def add_room_inventory(self, inventory: HotelRoomInventory) -> HotelRoomInventory:
        self.db.add(inventory)
        self.db.flush()
        return inventory

    def save_room_inventory(self, inventory: HotelRoomInventory) -> HotelRoomInventory:
        self.db.add(inventory)
        self.db.flush()
        return inventory

    def build_room_availability_map(
        self,
        *,
        rooms: list[HotelRoom],
        check_in_date: date,
        check_out_date: date,
    ) -> dict[str, int]:
        room_ids = [room.id for room in rooms]
        if not room_ids:
            return {}

        availability_map = {str(room.id): room.total_rooms for room in rooms}
        inventories = (
            self.db.query(HotelRoomInventory)
            .filter(
                HotelRoomInventory.room_id.in_(room_ids),
                HotelRoomInventory.inventory_date >= check_in_date,
                HotelRoomInventory.inventory_date < check_out_date,
            )
            .all()
        )

        for inventory in inventories:
            room_id = str(inventory.room_id)
            availability_map[room_id] = min(
                availability_map[room_id],
                inventory.available_rooms,
            )

        return availability_map

    def ensure_room_inventory_rows(
        self,
        *,
        room: HotelRoom,
        check_in_date: date,
        check_out_date: date,
    ) -> list[HotelRoomInventory]:
        existing_rows = self.get_room_inventories_for_update(
            room_id=str(room.id),
            check_in_date=check_in_date,
            check_out_date=check_out_date,
        )
        existing_by_date = {row.inventory_date: row for row in existing_rows}
        result: list[HotelRoomInventory] = []

        for inventory_date in self._stay_dates(check_in_date, check_out_date):
            row = existing_by_date.get(inventory_date)
            if row is None:
                row = HotelRoomInventory(
                    room_id=room.id,
                    inventory_date=inventory_date,
                    available_rooms=room.total_rooms,
                )
                self.add_room_inventory(row)
            result.append(row)

        return result
