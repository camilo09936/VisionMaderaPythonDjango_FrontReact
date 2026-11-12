from datetime import time
from django.db import migrations

DIAS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']  # en inglés: el front usa Date.getDay()


def cargar_datos(apps, schema_editor):
    EstadoCita = apps.get_model('visionmadera', 'EstadoCita')
    EstadoPqrs = apps.get_model('visionmadera', 'EstadoPqrs')
    TipoPqrs = apps.get_model('visionmadera', 'TipoPqrs')
    Sede = apps.get_model('visionmadera', 'Sede')
    Disenador = apps.get_model('visionmadera', 'Disenador')
    BloqueHorario = apps.get_model('visionmadera', 'BloqueHorario')
    AgendaDisenador = apps.get_model('visionmadera', 'AgendaDisenador')

    # Valores tomados de tu script SQL. El primero de cada lista queda con id=1 (default de Cita y Pqrs)
    for nombre in ['Pendiente', 'Confirmada', 'Realizada', 'Cancelada']:
        EstadoCita.objects.get_or_create(nombre=nombre)
    for nombre in ['Abierto', 'En Proceso', 'Cerrado']:
        EstadoPqrs.objects.get_or_create(nombre=nombre)
    for nombre in ['Peticion', 'Queja', 'Reclamo', 'Sugerencia']:
        TipoPqrs.objects.get_or_create(nombre=nombre)

    bloques = []
    for h in [8, 10, 12, 14, 16, 18]:
        b, _ = BloqueHorario.objects.get_or_create(hora_inicio=time(h, 0), hora_fin=time(h + 2, 0))
        bloques.append(b)

    # --- DATOS DE RELLENO: tu script no trae sedes ni diseñadores. Cámbialos por los reales ---
    sedes = {}
    for nombre, direccion, telefono in [
        ('Sede Norte', 'Calle 100 #20-10', '6040000001'),
        ('Sede Sur', 'Calle 10 #30-20', '6040000002'),
        ('Sede Centro', 'Carrera 50 #45-12', '6040000003'),
        ('Sede Bello', 'Calle 50 #50-50', '6040000004'),
        ('Sede Itagüí', 'Carrera 52 #70-15', '6040000005'),
    ]:
        sedes[nombre], _ = Sede.objects.get_or_create(
            nombre=nombre, defaults={'direccion': direccion, 'telefono': telefono})

    for nombre, apellido, correo, sede in [
        ('Daniel', 'Ruiz', 'daniel.ruiz@visionmadera.com', 'Sede Norte'),
        ('David', 'Gómez', 'david.gomez@visionmadera.com', 'Sede Norte'),
        ('Laura', 'Mora', 'laura.mora@visionmadera.com', 'Sede Sur'),
        ('Dayana', 'Correa', 'dayana.correa@visionmadera.com', 'Sede Sur'),
        ('Felipe', 'Castro', 'felipe.castro@visionmadera.com', 'Sede Centro'),
        ('Valentina', 'Gil', 'valentina.gil@visionmadera.com', 'Sede Bello'),
        ('Sebastian', 'Rios', 'sebastian.rios@visionmadera.com', 'Sede Itagüí'),
    ]:
        d, creado = Disenador.objects.get_or_create(
            correo=correo, defaults={'nombre': nombre, 'apellido': apellido, 'sede': sedes[sede]})
        if creado:
            AgendaDisenador.objects.bulk_create([
                AgendaDisenador(disenador=d, dia_semana=dia, bloque=b)
                for dia in DIAS for b in bloques
            ])


class Migration(migrations.Migration):

    dependencies = [
        ('visionmadera', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(cargar_datos, migrations.RunPython.noop),
    ]