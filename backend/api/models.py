from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Model Użytkownika zgodnie z dokumentacją.
    Logowanie przez email (username_field = 'email').
    """
    imie = models.CharField(max_length=50, blank=True)
    nazwisko = models.CharField(max_length=50, blank=True)
    email = models.EmailField(unique=True)
    dataRejestracji = models.DateTimeField(auto_now_add=True)
    statusUzytkownika = models.CharField(
        max_length=20,
        choices=[('aktywny', 'Aktywny'), ('zablokowany', 'Zablokowany')],
        default='aktywny'
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'uzytkownik'
    
    def __str__(self):
        return f"{self.email} ({self.imie} {self.nazwisko})"


class Administrator(models.Model):
    """
    Model Administratora - relacja 1:1 z User.
    Każdy administrator jest jednocześnie użytkownikiem.
    """
    id_administrator = models.AutoField(primary_key=True)
    id_uzytkownik = models.OneToOneField(User, on_delete=models.CASCADE, db_column='id_uzytkownik')
    
    class Meta:
        db_table = 'administrator'
    
    def __str__(self):
        return f"Administrator: {self.id_uzytkownik.email}"


class Produkt(models.Model):
    """
    Model Produktu zgodnie z dokumentacją.
    """
    id_produkt = models.AutoField(primary_key=True)
    nazwa = models.CharField(max_length=100)
    opis = models.TextField(blank=True)
    cenaBrutto = models.DecimalField(max_digits=10, decimal_places=2)
    kategoria = models.CharField(max_length=100)
    kolor = models.CharField(max_length=50)
    zdjecie = models.ImageField(upload_to='produkty/', blank=True, null=True)
    
    class Meta:
        db_table = 'produkt'
    
    def __str__(self):
        return f"{self.nazwa} - {self.cenaBrutto} zł"
    
    def get_dostepne_rozmiary(self):
        """Zwraca listę dostępnych rozmiarów dla produktu."""
        return self.rozmiary.filter(stanMagazynowy__gt=0)
    
    def get_all_rozmiary(self):
        """Zwraca wszystkie rozmiary dla produktu."""
        return self.rozmiary.all()


class RozmiarProduktu(models.Model):
    """
    Model Rozmiaru Produktu - każdy produkt może mieć wiele rozmiarów.
    """
    id_rozmiar = models.AutoField(primary_key=True)
    id_produkt = models.ForeignKey(Produkt, on_delete=models.CASCADE, db_column='id_produkt', related_name='rozmiary')
    rozmiar = models.CharField(max_length=10)  # XS, S, M, L, XL, XXL, 36, 38, 40, etc.
    stanMagazynowy = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'rozmiar_produktu'
        unique_together = ['id_produkt', 'rozmiar']
    
    def __str__(self):
        return f"{self.id_produkt.nazwa} - Rozmiar {self.rozmiar} ({self.stanMagazynowy} szt.)"


class Koszyk(models.Model):
    """
    Model Koszyka - każdy użytkownik ma dokładnie jeden koszyk.
    """
    id_koszyk = models.AutoField(primary_key=True)
    id_uzytkownik = models.OneToOneField(User, on_delete=models.CASCADE, db_column='id_uzytkownik')
    dataUtworzenia = models.DateTimeField(auto_now_add=True)
    rezerwacjaDo = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'koszyk'
    
    def __str__(self):
        return f"Koszyk {self.id_uzytkownik.email}"
    
    def przedluz_rezerwacje(self):
        """Przedłuż rezerwację o 30 minut."""
        self.rezerwacjaDo = timezone.now() + timezone.timedelta(minutes=30)
        self.save()


class PozycjaKoszyka(models.Model):
    """
    Model Pozycji Koszyka - produkty w koszyku użytkownika.
    """
    id_pozycjakoszyka = models.AutoField(primary_key=True)
    id_koszyk = models.ForeignKey(Koszyk, on_delete=models.CASCADE, db_column='id_koszyk', related_name='pozycje')
    id_produkt = models.ForeignKey(Produkt, on_delete=models.CASCADE, db_column='id_produkt')
    rozmiar = models.CharField(max_length=10, blank=True, null=True)
    ilosc = models.IntegerField(default=1)
    cenaJednostkowa = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'pozycjakoszyka'
    
    def __str__(self):
        return f"{self.ilosc}x {self.id_produkt.nazwa} ({self.rozmiar or 'brak rozmiaru'})"


class Zamowienie(models.Model):
    """
    Model Zamówienia zgodnie z dokumentacją.
    """
    id_zamowienie = models.AutoField(primary_key=True)
    id_uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, db_column='id_uzytkownik')
    dataZlozenia = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('oczekujące', 'Oczekujące'),
            ('w realizacji', 'W realizacji'),
            ('wysłane', 'Wysłane'),
            ('zakończone', 'Zakończone'),
            ('anulowane', 'Anulowane')
        ],
        default='oczekujące'
    )
    kwota = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'zamowienie'
    
    def __str__(self):
        return f"Zamówienie #{self.id_zamowienie} - {self.id_uzytkownik.email}"


class PozycjaZamowienia(models.Model):
    """
    Model Pozycji Zamówienia - produkty w zamówieniu.
    """
    id_pozycjazamowienia = models.AutoField(primary_key=True)
    id_zamowienie = models.ForeignKey(Zamowienie, on_delete=models.CASCADE, db_column='id_zamowienie', related_name='pozycje')
    id_produkt = models.ForeignKey(Produkt, on_delete=models.CASCADE, db_column='id_produkt')
    rozmiar = models.CharField(max_length=10, blank=True, null=True)
    ilosc = models.IntegerField(default=1)
    cenaJednostkowa = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        db_table = 'pozycjazamowienia'
    
    def __str__(self):
        return f"{self.ilosc}x {self.id_produkt.nazwa}"


class AdresDostawy(models.Model):
    """
    Model Adresu Dostawy - każdy zamówienie ma dokładnie jeden adres.
    """
    id_adres_dostawy = models.AutoField(primary_key=True)
    id_zamowienie = models.OneToOneField(Zamowienie, on_delete=models.CASCADE, db_column='id_zamowienie', related_name='adres_dostawy')
    ulica = models.CharField(max_length=100)
    miasto = models.CharField(max_length=50)
    kodPocztowy = models.CharField(max_length=10)
    kraj = models.CharField(max_length=50, default='Polska')
    
    class Meta:
        db_table = 'adresdostawy'
    
    def __str__(self):
        return f"{self.ulica}, {self.miasto}"


class Opinia(models.Model):
    """
    Model Opinii - użytkownik może dodać wiele opinii o produktach.
    """
    id_opinia = models.AutoField(primary_key=True)
    id_produkt = models.ForeignKey(Produkt, on_delete=models.CASCADE, db_column='id_produkt', related_name='opinie')
    id_uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, db_column='id_uzytkownik')
    ocena = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    komentarz = models.TextField(blank=True)
    data = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'opinia'
    
    def __str__(self):
        return f"Opinia {self.id_uzytkownik.email} o {self.id_produkt.nazwa} - {self.ocena}/5"


class Platnosc(models.Model):
    """
    Model Płatności - rejestruje wszystkie płatności.
    """
    id_platnosc = models.AutoField(primary_key=True)
    id_uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, db_column='id_uzytkownik')
    id_zamowienie = models.ForeignKey(Zamowienie, on_delete=models.CASCADE, db_column='id_zamowienie', related_name='platnosci')
    metoda = models.CharField(
        max_length=20,
        choices=[
            ('karta', 'Karta'),
            ('przelew', 'Przelew'),
            ('blik', 'BLIK'),
            ('paypal', 'PayPal')
        ]
    )
    kwota = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[
            ('oczekująca', 'Oczekująca'),
            ('zakończona', 'Zakończona'),
            ('odrzucona', 'Odrzucona')
        ],
        default='oczekująca'
    )
    znacznikCzasu = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'platnosc'
    
    def __str__(self):
        return f"Płatność #{self.id_platnosc} - {self.kwota} zł ({self.status})"


class Zwrot(models.Model):
    """
    Model Zwrotu - zgłoszenia zwrotów produktów.
    """
    id_zwrot = models.AutoField(primary_key=True)
    id_zamowienie = models.ForeignKey(Zamowienie, on_delete=models.CASCADE, db_column='id_zamowienie', related_name='zwroty')
    powod = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('oczekujący', 'Oczekujący'),
            ('przyjęty', 'Przyjęty'),
            ('odrzucony', 'Odrzucony')
        ],
        default='oczekujący'
    )
    dataZgloszenia = models.DateTimeField(auto_now_add=True)
    dataAktualizacji = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'zwrot'
    
    def save(self, *args, **kwargs):
        # Aktualizuj datę aktualizacji przy każdej zmianie
        self.dataAktualizacji = timezone.now()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Zwrot #{self.id_zwrot} - Zamówienie #{self.id_zamowienie.id_zamowienie}"
