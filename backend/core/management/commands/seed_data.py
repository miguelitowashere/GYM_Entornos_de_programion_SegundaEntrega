from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from memberships.models import Membership, UserMembership
from machines.models import Machine

User = get_user_model()

class Command(BaseCommand):
    help = "Seed initial data for the gym system"

    def handle(self, *args, **kwargs):

        # -----------------------
        # Crear Administradores
        # -----------------------
        admins = ["carlos", "camilo", "valentina", "sebastian", "margarita"]

        for name in admins:
            if not User.objects.filter(username=name).exists():
                User.objects.create_user(
                    username=name,
                    password=f"{name}123",
                    role="admin"
                )
                print(f"Admin creado: {name}")

        # -----------------------
        # Crear Usuarios normales
        # -----------------------
        users = [
            "mateo", "valeria", "andres", "julian", "sofia",
            "david", "laura", "camila", "manuel", "daniela"
        ]

        for name in users:
            if not User.objects.filter(username=name).exists():
                User.objects.create_user(
                    username=name,
                    password=f"{name}123",
                    role="user"
                )
                print(f"Usuario creado: {name}")

        # -----------------------
        # Membresías
        # -----------------------
        membresias = [
            ("Mensual", 30, 25.00),
            ("60 días", 60, 40.00),
            ("Anual", 365, 200.00),
        ]

        for name, days, price in membresias:
            obj, created = Membership.objects.get_or_create(
                name=name,
                defaults={"days": days, "price": price}
            )
            if created:
                print(f"Creada membresía: {name}")

        # -----------------------
        # Máquinas
        # -----------------------
        maquinas = [
            "Banco de press plano",
            "Caminadora",
            "Elíptica",
            "Máquina de pecho",
            "Máquina de espalda",
            "Máquina de pierna",
            "Bicicleta",
            "Remo",
            "Press militar",
            "Deltoides"
        ]

        for m in maquinas:
            Machine.objects.get_or_create(name=m)

        print("Máquinas creadas.")

        # -----------------------
        # Crear UserMembership
        # -----------------------
        for user in User.objects.all():
            UserMembership.objects.get_or_create(
                user=user,
                defaults={"remaining_days": 0}
            )

        print("UserMembership creado para todos los usuarios.")

        print("\nSEED COMPLETO ✔")
