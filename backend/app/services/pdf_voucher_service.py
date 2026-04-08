from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.enums import BookingItemType
from app.utils.enums import enum_to_str


class PDFVoucherService:
    def __init__(self) -> None:
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            "VoucherTitle",
            parent=self.styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#1F3A5F"),
            spaceAfter=8,
        )
        self.sub_title_style = ParagraphStyle(
            "VoucherSubTitle",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#555555"),
            spaceAfter=12,
        )
        self.section_title_style = ParagraphStyle(
            "SectionTitle",
            parent=self.styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#1F3A5F"),
            spaceBefore=10,
            spaceAfter=6,
        )
        self.body_style = ParagraphStyle(
            "VoucherBody",
            parent=self.styles["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            leading=13,
            spaceAfter=4,
        )

    def _build_info_table(self, booking) -> Table:
        data = [
            ["Booking Code", booking.booking_code, "Booking Status", enum_to_str(booking.status)],
            ["Payment Status", enum_to_str(booking.payment_status), "Currency", booking.currency],
            [
                "Booked At",
                str(booking.booked_at),
                "Customer",
                booking.user.full_name if booking.user else "Unknown",
            ],
            [
                "Customer Email",
                booking.user.email if booking.user else "Unknown",
                "Notes",
                booking.notes or "-",
            ],
        ]

        table = Table(data, colWidths=[30 * mm, 55 * mm, 30 * mm, 55 * mm])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D2DC")),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("LEADING", (0, 0), (-1, -1), 12),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        return table

    def _item_title_desc(self, item) -> tuple[str, str]:
        item_type = enum_to_str(item.item_type)

        if item_type == BookingItemType.flight.value and item.flight is not None:
            dep = item.flight.departure_airport.code if item.flight.departure_airport else "-"
            arr = item.flight.arrival_airport.code if item.flight.arrival_airport else "-"
            return (
                f"Flight {item.flight.flight_number}",
                f"Route: {dep} -> {arr}",
            )

        if item_type == BookingItemType.hotel.value and item.hotel_room is not None:
            hotel_name = item.hotel_room.hotel.name if item.hotel_room.hotel else "Hotel"
            return (
                f"{hotel_name} - {item.hotel_room.room_type}",
                f"Stay: {item.check_in_date} -> {item.check_out_date}"
                if item.check_in_date and item.check_out_date
                else "Hotel booking",
            )

        if item_type == BookingItemType.tour.value and item.tour_schedule is not None:
            tour_name = item.tour_schedule.tour.name if item.tour_schedule.tour else "Tour"
            return (
                tour_name,
                (
                    f"Travel date: {item.tour_schedule.departure_date} -> "
                    f"{item.tour_schedule.return_date}"
                ),
            )

        return ("Booking Item", "Travel service")

    def _build_items_table(self, booking) -> Table:
        data = [["Type", "Title", "Description", "Qty", "Unit Price", "Total"]]

        for item in booking.items:
            item_type = enum_to_str(item.item_type)
            title, desc = self._item_title_desc(item)
            data.append(
                [
                    item_type,
                    title,
                    desc,
                    str(item.quantity),
                    str(item.unit_price),
                    str(item.total_price),
                ]
            )

        table = Table(
            data,
            colWidths=[20 * mm, 45 * mm, 55 * mm, 15 * mm, 25 * mm, 25 * mm],
            repeatRows=1,
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F3A5F")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("LEADING", (0, 0), (-1, -1), 11),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CCD5DF")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (3, 1), (5, -1), "CENTER"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ]
            )
        )
        return table

    def _build_travelers_table(self, booking) -> Table:
        data = [["Full Name", "Type", "Passport", "Nationality", "Document"]]

        for traveler in booking.travelers:
            data.append(
                [
                    traveler.full_name,
                    enum_to_str(traveler.traveler_type),
                    traveler.passport_number or "-",
                    traveler.nationality or "-",
                    enum_to_str(traveler.document_type) or "-",
                ]
            )

        table = Table(
            data,
            colWidths=[55 * mm, 20 * mm, 35 * mm, 30 * mm, 30 * mm],
            repeatRows=1,
        )
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3E5F8A")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                    ("LEADING", (0, 0), (-1, -1), 11),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CCD5DF")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        return table

    def _build_pricing_table(self, booking) -> Table:
        data = [
            ["Base Amount", str(booking.total_base_amount)],
            ["Discount", str(booking.total_discount_amount)],
            ["Final Amount", str(booking.total_final_amount)],
        ]

        table = Table(data, colWidths=[45 * mm, 35 * mm], hAlign="RIGHT")
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7F9FB")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCD5DF")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )
        return table

    def generate_pdf_bytes(self, booking) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=18 * mm,
            rightMargin=18 * mm,
            topMargin=18 * mm,
            bottomMargin=18 * mm,
            title=f"Voucher - {booking.booking_code}",
        )

        story = []

        story.append(Paragraph("Travel Booking Voucher", self.title_style))
        story.append(
            Paragraph(
                "Booking confirmation generated by Secure Travel Booking Platform",
                self.sub_title_style,
            )
        )

        story.append(self._build_info_table(booking))
        story.append(Spacer(1, 8 * mm))

        story.append(Paragraph("Booked Services", self.section_title_style))
        story.append(self._build_items_table(booking))
        story.append(Spacer(1, 7 * mm))

        if booking.travelers:
            story.append(Paragraph("Travelers", self.section_title_style))
            story.append(self._build_travelers_table(booking))
            story.append(Spacer(1, 7 * mm))

        story.append(Paragraph("Pricing Summary", self.section_title_style))
        story.append(self._build_pricing_table(booking))
        story.append(Spacer(1, 7 * mm))

        story.append(
            Paragraph(
                "Please keep this voucher for check-in, boarding, hotel verification, "
                "or tour confirmation where applicable.",
                self.body_style,
            )
        )

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
