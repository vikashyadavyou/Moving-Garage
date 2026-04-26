"""
Management command to seed the IssueCatalog with predefined issues.
"""
from django.core.management.base import BaseCommand
from apps.services.models import IssueCatalog


ISSUES = [
    {
        'slug': 'flat-tire',
        'name': 'Flat Tire / Puncture Repair',
        'fixed_cost': 150,
        'description': 'Puncture repair or tube replacement for 2-wheeler tires.',
        'icon': '🔧',
        'sort_order': 1,
    },
    {
        'slug': 'dead-battery',
        'name': 'Dead Battery / Jump Start',
        'fixed_cost': 200,
        'description': 'Battery jump start or quick battery replacement.',
        'icon': '🔋',
        'sort_order': 2,
    },
    {
        'slug': 'clutch-brake-cable',
        'name': 'Broken Clutch / Brake Cable Replacement',
        'fixed_cost': 250,
        'description': 'Clutch wire or brake cable replacement on-site.',
        'icon': '⚙️',
        'sort_order': 3,
    },
    {
        'slug': 'spark-plug',
        'name': 'Spark Plug Issue',
        'fixed_cost': 120,
        'description': 'Spark plug cleaning or replacement.',
        'icon': '⚡',
        'sort_order': 4,
    },
    {
        'slug': 'engine-overheating',
        'name': 'Engine Overheating / Oil Issue',
        'fixed_cost': 300,
        'description': 'Engine coolant top-up, oil change, or overheating fix.',
        'icon': '🌡️',
        'sort_order': 5,
    },
    {
        'slug': 'pushing-to-garage',
        'name': 'Pushing to Garage',
        'fixed_cost': 25,
        'description': 'Push the vehicle to the nearest authorized garage.',
        'icon': '🏍️',
        'sort_order': 6,
    },
    {
        'slug': 'unknown-issue',
        'name': 'Unknown Issue (Diagnostic Fee)',
        'fixed_cost': 25,
        'description': 'On-site diagnostic inspection. Fee is replaced by repair cost if a specific repair is needed.',
        'icon': '🔍',
        'sort_order': 7,
    },
    {
        'slug': 'broken-drive-chain',
        'name': 'Broken Drive Chain',
        'fixed_cost': 150,
        'description': 'Drive chain repair or replacement for 2-wheelers.',
        'icon': '⛓️',
        'sort_order': 8,
    },
    {
        'slug': 'headlight-taillight',
        'name': 'Headlight/Taillight Bulb Replacement',
        'fixed_cost': 80,
        'description': 'Headlight or taillight bulb replacement on-site.',
        'icon': '💡',
        'sort_order': 9,
    },
    {
        'slug': 'engine-oil-leak',
        'name': 'Engine Oil Leak',
        'fixed_cost': 200,
        'description': 'Diagnose and fix engine oil leakage.',
        'icon': '🛢️',
        'sort_order': 10,
    },
]


class Command(BaseCommand):
    help = 'Seed the issue catalog with predefined breakdown issues and pricing.'

    def handle(self, *args, **options):
        # Deactivate the old 'towing' slug if it exists (renamed to pushing-to-garage)
        old_towing = IssueCatalog.objects.filter(slug='towing').first()
        if old_towing:
            old_towing.is_active = False
            old_towing.save(update_fields=['is_active'])
            self.stdout.write(
                self.style.WARNING(f'Deactivated old entry: {old_towing.name}')
            )

        for issue_data in ISSUES:
            obj, created = IssueCatalog.objects.update_or_create(
                slug=issue_data['slug'],
                defaults=issue_data,
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{action}: {obj.name} - INR {obj.fixed_cost}')
            )

        self.stdout.write(self.style.SUCCESS(
            f'\nDone! {len(ISSUES)} issues seeded.'
        ))
