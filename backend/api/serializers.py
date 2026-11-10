from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Produkt, Koszyk, PozycjaKoszyka, Zamowienie, 
    PozycjaZamowienia, AdresDostawy, Opinia, 
    Platnosc, Zwrot, Administrator, RozmiarProduktu
)

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializator użytkownika."""
    class Meta:
        model = User
        fields = ['id', 'email', 'imie', 'nazwisko', 'dataRejestracji', 'statusUzytkownika', 'is_staff']
        read_only_fields = ['id', 'dataRejestracji', 'statusUzytkownika', 'is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializator rejestracji nowego użytkownika."""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'imie', 'nazwisko', 'password', 'password_confirm']
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Hasła nie są identyczne")
        
        # Sprawdź czy email już istnieje
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError("Użytkownik z tym adresem email już istnieje")
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            imie=validated_data.get('imie', ''),
            nazwisko=validated_data.get('nazwisko', ''),
            username=validated_data['email']  # username = email dla AbstractUser
        )
        return user


class AdministratorSerializer(serializers.ModelSerializer):
    """Serializator administratora."""
    class Meta:
        model = Administrator
        fields = ['id_administrator', 'id_uzytkownik']


class RozmiarProduktuSerializer(serializers.ModelSerializer):
    """Serializator rozmiaru produktu."""
    class Meta:
        model = RozmiarProduktu
        fields = ['id_rozmiar', 'rozmiar', 'stanMagazynowy']

class OpiniaSerializer(serializers.ModelSerializer):
    """Serializator opinii."""
    uzytkownik_imie = serializers.CharField(source='id_uzytkownik.imie', read_only=True)
    uzytkownik_nazwisko = serializers.CharField(source='id_uzytkownik.nazwisko', read_only=True)
    produkt_nazwa = serializers.CharField(source='id_produkt.nazwa', read_only=True)
    
    class Meta:
        model = Opinia
        fields = ['id_opinia', 'id_produkt', 'id_uzytkownik', 'uzytkownik_imie', 
                  'uzytkownik_nazwisko', 'produkt_nazwa', 'ocena', 'komentarz', 'data']
        read_only_fields = ['id_opinia', 'id_uzytkownik', 'data']

class ProduktSerializer(serializers.ModelSerializer):
    """Serializator produktu."""
    zdjecie_url = serializers.SerializerMethodField()
    rozmiary = RozmiarProduktuSerializer(many=True, read_only=True)
    dostepne_rozmiary = serializers.SerializerMethodField()
    opinie = OpiniaSerializer(many=True, read_only=True, source='opinia_set')

    # Pola do tworzenia/edycji - obsługa wielu rozmiarów
    rozmiary_data = serializers.JSONField(write_only=True, required=False, default=[])
    
    class Meta:
        model = Produkt
        fields = ['id_produkt', 'nazwa', 'opis', 'cenaBrutto', 'kategoria', 
                  'kolor', 'zdjecie', 'zdjecie_url', 'rozmiary', 'dostepne_rozmiary',
                  'rozmiary_data','opinie']
    
    def get_zdjecie_url(self, obj):
        if obj.zdjecie:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.zdjecie.url)
            return obj.zdjecie.url
        return None
    
    def get_dostepne_rozmiary(self, obj):
        """Zwraca listę dostępnych rozmiarów (tylko te z stanem > 0)."""
        return list(obj.rozmiary.filter(stanMagazynowy__gt=0).values_list('rozmiar', flat=True))
    
    def create(self, validated_data):
        """Tworzenie produktu z wieloma rozmiarami."""
        rozmiary_data = validated_data.pop('rozmiary_data', [])
        
        produkt = Produkt.objects.create(**validated_data)
        
        # Utwórz rozmiary dla produktu
        for size_info in rozmiary_data:
            if isinstance(size_info, dict):
                rozmiar = size_info.get('rozmiar')
                stan = size_info.get('stanMagazynowy', 0)
                if rozmiar:
                    RozmiarProduktu.objects.create(
                        id_produkt=produkt,
                        rozmiar=rozmiar,
                        stanMagazynowy=stan
                    )
        
        return produkt
    
    def update(self, instance, validated_data):
        """Aktualizacja produktu z wieloma rozmiarami."""
        rozmiary_data = validated_data.pop('rozmiary_data', None)
        
        # Aktualizuj pola produktu
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Aktualizuj rozmiary jeśli podano
        if rozmiary_data is not None:
            # Usuń istniejące rozmiary
            instance.rozmiary.all().delete()
            
            # Dodaj nowe rozmiary
            for size_info in rozmiary_data:
                if isinstance(size_info, dict):
                    rozmiar = size_info.get('rozmiar')
                    stan = size_info.get('stanMagazynowy', 0)
                    if rozmiar:
                        RozmiarProduktu.objects.create(
                            id_produkt=instance,
                            rozmiar=rozmiar,
                            stanMagazynowy=stan
                        )
        
        return instance


class PozycjaKoszykaSerializer(serializers.ModelSerializer):
    """Serializator pozycji koszyka."""
    produkt_nazwa = serializers.CharField(source='id_produkt.nazwa', read_only=True)
    produkt_zdjecie = serializers.CharField(source='id_produkt.zdjecie', read_only=True)
    rozmiar = serializers.CharField(read_only=True)
    
    class Meta:
        model = PozycjaKoszyka
        fields = ['id_pozycjakoszyka', 'id_koszyk', 'id_produkt', 'produkt_nazwa', 
                  'produkt_zdjecie', 'rozmiar', 'ilosc', 'cenaJednostkowa']


class KoszykSerializer(serializers.ModelSerializer):
    """Serializator koszyka z pozycjami."""
    pozycje = PozycjaKoszykaSerializer(many=True, read_only=True)
    
    class Meta:
        model = Koszyk
        fields = ['id_koszyk', 'id_uzytkownik', 'dataUtworzenia', 'rezerwacjaDo', 'pozycje']


class AdresDostawySerializer(serializers.ModelSerializer):
    """Serializator adresu dostawy."""
    class Meta:
        model = AdresDostawy
        fields = ['id_adres_dostawy', 'id_zamowienie', 'ulica', 'miasto', 
                  'kodPocztowy', 'kraj']
        extra_kwargs = {'id_zamowienie': {'required': False}}


class PozycjaZamowieniaSerializer(serializers.ModelSerializer):
    """Serializator pozycji zamówienia."""
    produkt_nazwa = serializers.CharField(source='id_produkt.nazwa', read_only=True)
    produkt_zdjecie = serializers.CharField(source='id_produkt.zdjecie', read_only=True)
    
    class Meta:
        model = PozycjaZamowienia
        fields = ['id_pozycjazamowienia', 'id_zamowienie', 'id_produkt', 
                  'produkt_nazwa', 'produkt_zdjecie', 'ilosc', 'cenaJednostkowa']


class ZamowienieSerializer(serializers.ModelSerializer):
    """Serializator zamówienia z pozycjami i adresem."""
    pozycje = PozycjaZamowieniaSerializer(many=True, read_only=True)
    adres_dostawy = AdresDostawySerializer(read_only=True)
    czy_zwrot_zgloszony = serializers.SerializerMethodField()
    
    class Meta:
        model = Zamowienie
        fields = ['id_zamowienie', 'id_uzytkownik', 'dataZlozenia', 'status', 
                  'kwota', 'pozycje', 'adres_dostawy', 'czy_zwrot_zgloszony']
    
    def get_czy_zwrot_zgloszony(self, obj):
        from .models import Zwrot
        return Zwrot.objects.filter(id_zamowienie=obj).exists()


class PlatnoscSerializer(serializers.ModelSerializer):
    """Serializator płatności."""
    class Meta:
        model = Platnosc
        fields = ['id_platnosc', 'id_uzytkownik', 'id_zamowienie', 'metoda', 
                  'kwota', 'status', 'znacznikCzasu']
        read_only_fields = ['id_platnosc', 'znacznikCzasu']


class ZwrotSerializer(serializers.ModelSerializer):
    """Serializator zwrotu."""
    class Meta:
        model = Zwrot
        fields = ['id_zwrot', 'id_zamowienie', 'powod', 'status', 
                  'dataZgloszenia', 'dataAktualizacji']
        read_only_fields = ['id_zwrot', 'dataZgloszenia', 'dataAktualizacji', 'status']
