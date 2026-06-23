from django.contrib import admin
from django.urls import path, re_path, include
from rest_framework import permissions, routers
from rest_framework_simplejwt.views import TokenRefreshView
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from detection.views import IncidentViewSet
from core.views import FlowRecordViewSet
from response.views import AutomatedResponseViewSet, AppealRequestViewSet
from compliance.views import SystemConfigurationViewSet
from accounts.views import UserViewSet, AuditLogViewSet, login_view, me_view

schema_view = get_schema_view(
   openapi.Info(
      title="AI-NIDS API",
      default_version='v1',
      description="AI-Based Detection and Automated Response System — Caleb University",
      contact=openapi.Contact(email="contact@ainids.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

router = routers.DefaultRouter()
router.register(r'incidents',       IncidentViewSet)
router.register(r'flows',           FlowRecordViewSet)
router.register(r'responses',       AutomatedResponseViewSet)
router.register(r'appeals',         AppealRequestViewSet)
router.register(r'config',          SystemConfigurationViewSet)
router.register(r'users',           UserViewSet)
router.register(r'audit-logs',      AuditLogViewSet)

urlpatterns = [
    path('admin/',            admin.site.urls),
    path('api/v1/',           include(router.urls)),
    path('api/v1/auth/login/',   login_view,       name='login'),
    path('api/v1/auth/me/',      me_view,          name='me'),
    path('api/v1/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/',   schema_view.with_ui('redoc',   cache_timeout=0), name='schema-redoc'),
]
