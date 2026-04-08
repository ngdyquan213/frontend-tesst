from app.api.dependencies.service_registry import ServiceRegistry


def test_service_registry_caches_dependencies_per_request(db_session):
    registry = ServiceRegistry(db_session)

    assert registry.audit_service is registry.audit_service
    assert registry.booking_repo is registry.booking_repo
    assert registry.email_worker is registry.email_worker


def test_service_registry_shares_nested_dependencies(db_session):
    registry = ServiceRegistry(db_session)

    booking_service = registry.build_booking_service()
    voucher_service = registry.build_voucher_service()
    admin_bulk_service = registry.build_admin_bulk_service()

    assert booking_service.booking_repo is registry.booking_repo
    assert voucher_service.voucher_document_service.storage_service is registry.storage_service
    assert admin_bulk_service.payment_repo is registry.payment_repo
    assert admin_bulk_service.admin_service.audit_service is registry.audit_service
