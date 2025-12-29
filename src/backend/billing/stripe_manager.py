import stripe
import os
from datetime import datetime

class BillingManager:
    def __init__(self):
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.plans = {
            'starter': {'price': 'price_starter', 'amount': 2900},  # €29/month
            'professional': {'price': 'price_pro', 'amount': 9900},  # €99/month
            'enterprise': {'price': 'price_enterprise', 'amount': 29900}  # €299/month
        }
    
    def create_customer(self, email, name, tenant_id):
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={'tenant_id': tenant_id}
            )
            return customer.id
        except Exception as e:
            return None
    
    def create_subscription(self, customer_id, plan_name):
        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': self.plans[plan_name]['price']}],
                payment_behavior='default_incomplete',
                expand=['latest_invoice.payment_intent']
            )
            return {
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret
            }
        except Exception as e:
            return None
    
    def get_usage_stats(self, tenant_id):
        return {
            'emails_sent': 450,
            'users_active': 12,
            'storage_used_gb': 3.2,
            'api_calls': 1250,
            'billing_cycle': 'monthly',
            'next_billing_date': '2024-02-01'
        }
    
    def calculate_overage(self, tenant_id, plan_name):
        stats = self.get_usage_stats(tenant_id)
        plan_limits = {
            'starter': {'emails': 500, 'users': 5, 'storage': 5},
            'professional': {'emails': 2000, 'users': 25, 'storage': 25},
            'enterprise': {'emails': 10000, 'users': 100, 'storage': 100}
        }
        
        limits = plan_limits.get(plan_name, {})
        overage = 0
        
        if stats['emails_sent'] > limits.get('emails', 0):
            overage += (stats['emails_sent'] - limits['emails']) * 0.05  # €0.05 per email
        
        return overage