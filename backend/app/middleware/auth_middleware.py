from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class AuthContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.user_id = None
        request.state.authenticated = False

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            request.state.authenticated = True

        response = await call_next(request)
        return response
