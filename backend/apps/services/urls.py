from django.urls import path
from . import views

urlpatterns = [
    path('issues/', views.IssueCatalogListView.as_view(), name='issue-list'),
    path('requests/', views.ServiceRequestCreateView.as_view(), name='request-create'),
    path('requests/list/', views.ServiceRequestListView.as_view(), name='request-list'),
    path('requests/<int:pk>/', views.ServiceRequestDetailView.as_view(), name='request-detail'),
    path('requests/<int:pk>/accept/', views.AcceptRequestView.as_view(), name='request-accept'),
    path('requests/<int:pk>/status/', views.UpdateStatusView.as_view(), name='request-status'),
    path('requests/<int:pk>/diagnose/', views.DiagnoseOverrideView.as_view(), name='request-diagnose'),
    path('requests/<int:pk>/approve-quote/', views.ApproveQuoteView.as_view(), name='request-approve-quote'),
    path('requests/<int:pk>/complete/', views.CompleteRequestView.as_view(), name='request-complete'),
    path('requests/<int:pk>/confirm-cash/', views.ConfirmCashPaymentView.as_view(), name='request-confirm-cash'),
    path('requests/<int:pk>/cancel/', views.CancelRequestView.as_view(), name='request-cancel'),
    path('requests/pending-count/', views.PendingRequestCountView.as_view(), name='request-pending-count'),
]
