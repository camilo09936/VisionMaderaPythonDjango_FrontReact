from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Usuario(models.Model):
    documento = models.CharField(max_length=20, primary_key=True)
    nombre1 = models.CharField(max_length=100)
    nombre2 = models.CharField(max_length=100, null=True, blank=True)
    apellido1 = models.CharField(max_length=100)
    apellido2 = models.CharField(max_length=100, null=True, blank=True)
    correo = models.EmailField(max_length=100, unique=True)
    contrasena = models.CharField(max_length=255)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20)
    fecha_nacimiento = models.DateField()
    
    def __str__(self):
        n2 = f" {self.nombre2}" if self.nombre2 else ""
        a2 = f" {self.apellido2}" if self.apellido2 else ""
        return f"{self.nombre1}{n2} {self.apellido1}{a2} ({self.documento})"

class EstadoCita(models.Model):
    id_estado_cita = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.nombre
    
class BloqueHorario(models.Model):
    id_bloque = models.AutoField(primary_key=True)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    
    def __str__(self):
        return f"{self.hora_inicio.strftime('%H:%M')} - {self.hora_fin.strftime('%H:%M')}"

class Sede(models.Model):
    id_sede = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=200)
    telefono = models.CharField(max_length=100)
    
    def __str__(self):
        return self.nombre

class Disenador(models.Model):
    id_disenador = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    correo = models.EmailField(max_length=100, unique=True)
    sede = models.ForeignKey(Sede, on_delete=models.PROTECT, db_column='id_sede')

    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class AgendaDisenador(models.Model):
    id_agenda = models.AutoField(primary_key=True)
    disenador = models.ForeignKey(Disenador, on_delete=models.PROTECT, db_column='id_disenador')
    dia_semana = models.CharField(max_length=20)
    bloque = models.ForeignKey(BloqueHorario, on_delete=models.PROTECT, db_column='id_bloque')

    def __str__(self):
        return f"{self.disenador} {self.dia_semana} ({self.bloque})"

class Cita(models.Model):
    id_cita = models.AutoField(primary_key=True)
    fecha = models.DateField()
    bloque = models.ForeignKey(BloqueHorario, on_delete=models.PROTECT, db_column='id_bloque')
    estado_cita = models.ForeignKey(EstadoCita, on_delete=models.PROTECT, default=1, db_column='id_estado_cita')
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT, db_column='documento')
    sede = models.ForeignKey(Sede, on_delete=models.PROTECT, db_column='id_sede')
    disenador = models.ForeignKey(Disenador, on_delete=models.PROTECT, db_column='id_disenador')

    def __str__(self):
        return f"Cita {self.id_cita} - {self.fecha}"

class TipoPqrs(models.Model):
    id_tipo_pqrs = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre

class EstadoPqrs(models.Model):
    id_estado_pqrs = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.nombre

class Pqrs(models.Model):
    id_pqrs = models.AutoField(primary_key=True)
    tipo_pqrs = models.ForeignKey(TipoPqrs, on_delete=models.PROTECT, related_name='pqrs', db_column='id_tipo_pqrs')
    descripcion = models.TextField(max_length=1000)
    fecha = models.DateField(auto_now_add=True, db_column='fecha')
    estado_pqrs = models.ForeignKey(EstadoPqrs, on_delete=models.PROTECT, default=1, db_column='id_estado_pqrs')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='pqrs', db_column='documento')

    def __str__(self):
        return f"PQRS {self.id_pqrs} - {self.tipo_pqrs.nombre}"

class Calificacion(models.Model):
    id_calificacion = models.AutoField(primary_key=True)
    puntaje = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.CharField(max_length=500, blank=True, null=True)
    fecha = models.DateField(auto_now_add=True)
    cita = models.OneToOneField(Cita, on_delete=models.PROTECT, db_column='id_cita')

    def __str__(self):
        return f"Calificación {self.puntaje} - Cita {self.cita.id_cita}"