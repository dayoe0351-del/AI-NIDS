from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Seeds the database with initial users and roles'

    def handle(self, *args, **options):
        # Username, Email, Password, Role, Department
        users_data = [
            ('admin', 'admin@cuniversity.edu', 'admin123', 'SUPER_ADMIN', 'Security Operations'),
            ('analyst', 'analyst@cuniversity.edu', 'analyst123', 'ANALYST', 'Threat Analysis'),
            ('operator', 'operator@cuniversity.edu', 'operator123', 'OPERATOR', 'SOC Operations'),
            ('viewer', 'viewer@cuniversity.edu', 'viewer123', 'VIEWER', 'Compliance'),
        ]

        for username, email, password, role, dept in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email, 
                    'is_staff': True if role == 'SUPER_ADMIN' else False, 
                    'is_superuser': True if role == 'SUPER_ADMIN' else False
                }
            )
            
            # Set/update password and profile
            user.set_password(password)
            user.save()
            
            profile, p_created = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': role, 'department': dept}
            )
            
            if not p_created:
                profile.role = role
                profile.department = dept
                profile.save()
                
            status_str = "created" if created else "updated"
            self.stdout.write(self.style.SUCCESS(
                f"User '{username}' ({role}) {status_str} with password: {password}"
            ))
