CREATE DATABASE  IF NOT EXISTS `narejonie` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `narejonie`;
-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: narejonie
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `administrator`
--

DROP TABLE IF EXISTS `administrator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrator` (
  `id_administrator` int NOT NULL AUTO_INCREMENT,
  `id_uzytkownik` int NOT NULL,
  PRIMARY KEY (`id_administrator`),
  UNIQUE KEY `id_uzytkownik` (`id_uzytkownik`),
  CONSTRAINT `administrator_id_uzytkownik_ea883360_fk_uzytkownik_id` FOREIGN KEY (`id_uzytkownik`) REFERENCES `uzytkownik` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrator`
--

LOCK TABLES `administrator` WRITE;
/*!40000 ALTER TABLE `administrator` DISABLE KEYS */;
/*!40000 ALTER TABLE `administrator` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `adresdostawy`
--

DROP TABLE IF EXISTS `adresdostawy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adresdostawy` (
  `id_adres_dostawy` int NOT NULL AUTO_INCREMENT,
  `ulica` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `miasto` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kodPocztowy` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kraj` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_zamowienie` int NOT NULL,
  PRIMARY KEY (`id_adres_dostawy`),
  UNIQUE KEY `id_zamowienie` (`id_zamowienie`),
  CONSTRAINT `adresdostawy_id_zamowienie_63912658_fk_zamowienie_id_zamowienie` FOREIGN KEY (`id_zamowienie`) REFERENCES `zamowienie` (`id_zamowienie`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adresdostawy`
--

LOCK TABLES `adresdostawy` WRITE;
/*!40000 ALTER TABLE `adresdostawy` DISABLE KEYS */;
INSERT INTO `adresdostawy` VALUES (1,'qwer','qwer','23345','Polska',1),(2,'tyui','tyui','34567','Polska',2),(3,'ul. Przykładowa 1/2','Warszawa','00-001','Polska',3),(4,'ul. Przykładowa 1/2','Warszawa','00-001','Polska',4),(5,'ul. Przykładowa 1/2','Warszawa','00-001','Polska',5),(6,'ul. Testowa 10','Kraków','30-001','Polska',6),(7,'ul. Testowa 10','Kraków','30-001','Polska',7),(8,'ul. Adminowska 5','Lublin','20-001','Polska',8),(9,'P','qwer','12345','Polska',9),(10,'P','P','23345','Polska',10);
/*!40000 ALTER TABLE `adresdostawy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',3,'add_permission'),(6,'Can change permission',3,'change_permission'),(7,'Can delete permission',3,'delete_permission'),(8,'Can view permission',3,'view_permission'),(9,'Can add group',2,'add_group'),(10,'Can change group',2,'change_group'),(11,'Can delete group',2,'delete_group'),(12,'Can view group',2,'view_group'),(13,'Can add content type',4,'add_contenttype'),(14,'Can change content type',4,'change_contenttype'),(15,'Can delete content type',4,'delete_contenttype'),(16,'Can view content type',4,'view_contenttype'),(17,'Can add session',5,'add_session'),(18,'Can change session',5,'change_session'),(19,'Can delete session',5,'delete_session'),(20,'Can view session',5,'view_session'),(21,'Can add produkt',13,'add_produkt'),(22,'Can change produkt',13,'change_produkt'),(23,'Can delete produkt',13,'delete_produkt'),(24,'Can view produkt',13,'view_produkt'),(25,'Can add user',14,'add_user'),(26,'Can change user',14,'change_user'),(27,'Can delete user',14,'delete_user'),(28,'Can view user',14,'view_user'),(29,'Can add administrator',6,'add_administrator'),(30,'Can change administrator',6,'change_administrator'),(31,'Can delete administrator',6,'delete_administrator'),(32,'Can view administrator',6,'view_administrator'),(33,'Can add koszyk',8,'add_koszyk'),(34,'Can change koszyk',8,'change_koszyk'),(35,'Can delete koszyk',8,'delete_koszyk'),(36,'Can view koszyk',8,'view_koszyk'),(37,'Can add pozycja koszyka',11,'add_pozycjakoszyka'),(38,'Can change pozycja koszyka',11,'change_pozycjakoszyka'),(39,'Can delete pozycja koszyka',11,'delete_pozycjakoszyka'),(40,'Can view pozycja koszyka',11,'view_pozycjakoszyka'),(41,'Can add opinia',9,'add_opinia'),(42,'Can change opinia',9,'change_opinia'),(43,'Can delete opinia',9,'delete_opinia'),(44,'Can view opinia',9,'view_opinia'),(45,'Can add zamowienie',15,'add_zamowienie'),(46,'Can change zamowienie',15,'change_zamowienie'),(47,'Can delete zamowienie',15,'delete_zamowienie'),(48,'Can view zamowienie',15,'view_zamowienie'),(49,'Can add pozycja zamowienia',12,'add_pozycjazamowienia'),(50,'Can change pozycja zamowienia',12,'change_pozycjazamowienia'),(51,'Can delete pozycja zamowienia',12,'delete_pozycjazamowienia'),(52,'Can view pozycja zamowienia',12,'view_pozycjazamowienia'),(53,'Can add platnosc',10,'add_platnosc'),(54,'Can change platnosc',10,'change_platnosc'),(55,'Can delete platnosc',10,'delete_platnosc'),(56,'Can view platnosc',10,'view_platnosc'),(57,'Can add adres dostawy',7,'add_adresdostawy'),(58,'Can change adres dostawy',7,'change_adresdostawy'),(59,'Can delete adres dostawy',7,'delete_adresdostawy'),(60,'Can view adres dostawy',7,'view_adresdostawy'),(61,'Can add zwrot',16,'add_zwrot'),(62,'Can change zwrot',16,'change_zwrot'),(63,'Can delete zwrot',16,'delete_zwrot'),(64,'Can view zwrot',16,'view_zwrot'),(65,'Can add rozmiar produktu',17,'add_rozmiarproduktu'),(66,'Can change rozmiar produktu',17,'change_rozmiarproduktu'),(67,'Can delete rozmiar produktu',17,'delete_rozmiarproduktu'),(68,'Can view rozmiar produktu',17,'view_rozmiarproduktu');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_uzytkownik_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_uzytkownik_id` FOREIGN KEY (`user_id`) REFERENCES `uzytkownik` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(6,'api','administrator'),(7,'api','adresdostawy'),(8,'api','koszyk'),(9,'api','opinia'),(10,'api','platnosc'),(11,'api','pozycjakoszyka'),(12,'api','pozycjazamowienia'),(13,'api','produkt'),(17,'api','rozmiarproduktu'),(14,'api','user'),(15,'api','zamowienie'),(16,'api','zwrot'),(2,'auth','group'),(3,'auth','permission'),(4,'contenttypes','contenttype'),(5,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-04-21 20:07:54.963121'),(2,'contenttypes','0002_remove_content_type_name','2026-04-21 20:07:55.068454'),(3,'auth','0001_initial','2026-04-21 20:07:55.374406'),(4,'auth','0002_alter_permission_name_max_length','2026-04-21 20:07:55.445313'),(5,'auth','0003_alter_user_email_max_length','2026-04-21 20:07:55.451509'),(6,'auth','0004_alter_user_username_opts','2026-04-21 20:07:55.458129'),(7,'auth','0005_alter_user_last_login_null','2026-04-21 20:07:55.465084'),(8,'auth','0006_require_contenttypes_0002','2026-04-21 20:07:55.468033'),(9,'auth','0007_alter_validators_add_error_messages','2026-04-21 20:07:55.477975'),(10,'auth','0008_alter_user_username_max_length','2026-04-21 20:07:55.484469'),(11,'auth','0009_alter_user_last_name_max_length','2026-04-21 20:07:55.491109'),(12,'auth','0010_alter_group_name_max_length','2026-04-21 20:07:55.506517'),(13,'auth','0011_update_proxy_permissions','2026-04-21 20:07:55.514276'),(14,'auth','0012_alter_user_first_name_max_length','2026-04-21 20:07:55.520973'),(15,'api','0001_initial','2026-04-21 20:07:57.091003'),(16,'admin','0001_initial','2026-04-21 20:07:57.244413'),(17,'admin','0002_logentry_remove_auto_add','2026-04-21 20:07:57.254183'),(18,'admin','0003_logentry_add_action_flag_choices','2026-04-21 20:07:57.273996'),(19,'sessions','0001_initial','2026-04-21 20:07:57.314209'),(20,'api','0002_alter_produkt_zdjecie','2026-04-22 07:18:04.720312'),(21,'api','0003_remove_produkt_rozmiar_remove_produkt_stanmagazynowy_and_more','2026-04-22 11:37:58.571989'),(22,'api','0004_pozycjakoszyka_rozmiar','2026-04-22 12:48:58.043447');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `koszyk`
--

DROP TABLE IF EXISTS `koszyk`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `koszyk` (
  `id_koszyk` int NOT NULL AUTO_INCREMENT,
  `dataUtworzenia` datetime(6) NOT NULL,
  `rezerwacjaDo` datetime(6) DEFAULT NULL,
  `id_uzytkownik` int NOT NULL,
  PRIMARY KEY (`id_koszyk`),
  UNIQUE KEY `id_uzytkownik` (`id_uzytkownik`),
  CONSTRAINT `koszyk_id_uzytkownik_b8bc1de7_fk_uzytkownik_id` FOREIGN KEY (`id_uzytkownik`) REFERENCES `uzytkownik` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `koszyk`
--

LOCK TABLES `koszyk` WRITE;
/*!40000 ALTER TABLE `koszyk` DISABLE KEYS */;
INSERT INTO `koszyk` VALUES (1,'2026-04-21 20:21:32.246462','2026-04-22 15:15:53.914005',1),(2,'2026-04-22 08:26:23.990389','2026-04-22 15:55:27.048115',3),(3,'2026-04-22 08:30:14.965156','2026-04-22 14:29:54.201501',4),(4,'2026-04-22 09:46:51.955023','2026-04-22 10:16:51.969496',2);
/*!40000 ALTER TABLE `koszyk` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opinia`
--

DROP TABLE IF EXISTS `opinia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opinia` (
  `id_opinia` int NOT NULL AUTO_INCREMENT,
  `ocena` int NOT NULL,
  `komentarz` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` datetime(6) NOT NULL,
  `id_uzytkownik` int NOT NULL,
  `id_produkt` int NOT NULL,
  PRIMARY KEY (`id_opinia`),
  KEY `opinia_id_uzytkownik_cd175bc8_fk_uzytkownik_id` (`id_uzytkownik`),
  KEY `opinia_id_produkt_0885c641_fk_produkt_id_produkt` (`id_produkt`),
  CONSTRAINT `opinia_id_produkt_0885c641_fk_produkt_id_produkt` FOREIGN KEY (`id_produkt`) REFERENCES `produkt` (`id_produkt`),
  CONSTRAINT `opinia_id_uzytkownik_cd175bc8_fk_uzytkownik_id` FOREIGN KEY (`id_uzytkownik`) REFERENCES `uzytkownik` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opinia`
--

LOCK TABLES `opinia` WRITE;
/*!40000 ALTER TABLE `opinia` DISABLE KEYS */;
INSERT INTO `opinia` VALUES (1,5,'wszystko ok','2026-04-22 11:15:38.172025',3,6);
/*!40000 ALTER TABLE `opinia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platnosc`
--

DROP TABLE IF EXISTS `platnosc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `platnosc` (
  `id_platnosc` int NOT NULL AUTO_INCREMENT,
  `metoda` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kwota` decimal(10,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `znacznikCzasu` datetime(6) NOT NULL,
  `id_uzytkownik` int NOT NULL,
  `id_zamowienie` int NOT NULL,
  PRIMARY KEY (`id_platnosc`),
  KEY `platnosc_id_uzytkownik_0a8337de_fk_uzytkownik_id` (`id_uzytkownik`),
  KEY `platnosc_id_zamowienie_515f0d45_fk_zamowienie_id_zamowienie` (`id_zamowienie`),
  CONSTRAINT `platnosc_id_uzytkownik_0a8337de_fk_uzytkownik_id` FOREIGN KEY (`id_uzytkownik`) REFERENCES `uzytkownik` (`id`),
  CONSTRAINT `platnosc_id_zamowienie_515f0d45_fk_zamowienie_id_zamowienie` FOREIGN KEY (`id_zamowienie`) REFERENCES `zamowienie` (`id_zamowienie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platnosc`
--

LOCK TABLES `platnosc` WRITE;
/*!40000 ALTER TABLE `platnosc` DISABLE KEYS */;
/*!40000 ALTER TABLE `platnosc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pozycjakoszyka`
--

DROP TABLE IF EXISTS `pozycjakoszyka`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pozycjakoszyka` (
  `id_pozycjakoszyka` int NOT NULL AUTO_INCREMENT,
  `ilosc` int NOT NULL,
  `cenaJednostkowa` decimal(10,2) NOT NULL,
  `id_koszyk` int NOT NULL,
  `id_produkt` int NOT NULL,
  `rozmiar` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_pozycjakoszyka`),
  KEY `pozycjakoszyka_id_koszyk_cededdd0_fk_koszyk_id_koszyk` (`id_koszyk`),
  KEY `pozycjakoszyka_id_produkt_87d09e5a_fk_produkt_id_produkt` (`id_produkt`),
  CONSTRAINT `pozycjakoszyka_id_koszyk_cededdd0_fk_koszyk_id_koszyk` FOREIGN KEY (`id_koszyk`) REFERENCES `koszyk` (`id_koszyk`),
  CONSTRAINT `pozycjakoszyka_id_produkt_87d09e5a_fk_produkt_id_produkt` FOREIGN KEY (`id_produkt`) REFERENCES `produkt` (`id_produkt`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pozycjakoszyka`
--

LOCK TABLES `pozycjakoszyka` WRITE;
/*!40000 ALTER TABLE `pozycjakoszyka` DISABLE KEYS */;
INSERT INTO `pozycjakoszyka` VALUES (26,1,129.99,3,2,'XL'),(29,1,129.99,3,2,'L'),(31,1,129.99,1,2,'M');
/*!40000 ALTER TABLE `pozycjakoszyka` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pozycjazamowienia`
--

DROP TABLE IF EXISTS `pozycjazamowienia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pozycjazamowienia` (
  `id_pozycjazamowienia` int NOT NULL AUTO_INCREMENT,
  `ilosc` int NOT NULL,
  `cenaJednostkowa` decimal(10,2) NOT NULL,
  `id_produkt` int NOT NULL,
  `id_zamowienie` int NOT NULL,
  PRIMARY KEY (`id_pozycjazamowienia`),
  KEY `pozycjazamowienia_id_produkt_7a860d87_fk_produkt_id_produkt` (`id_produkt`),
  KEY `pozycjazamowienia_id_zamowienie_6d067c36_fk_zamowieni` (`id_zamowienie`),
  CONSTRAINT `pozycjazamowienia_id_produkt_7a860d87_fk_produkt_id_produkt` FOREIGN KEY (`id_produkt`) REFERENCES `produkt` (`id_produkt`),
  CONSTRAINT `pozycjazamowienia_id_zamowienie_6d067c36_fk_zamowieni` FOREIGN KEY (`id_zamowienie`) REFERENCES `zamowienie` (`id_zamowienie`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pozycjazamowienia`
--

LOCK TABLES `pozycjazamowienia` WRITE;
/*!40000 ALTER TABLE `pozycjazamowienia` DISABLE KEYS */;
INSERT INTO `pozycjazamowienia` VALUES (1,1,149.99,1,1),(2,1,199.99,5,1),(3,1,179.99,6,1),(4,1,59.99,10,1),(5,2,179.99,6,2),(6,2,149.99,1,3),(7,1,89.99,2,4),(8,1,250.00,3,5),(9,1,149.99,1,6),(10,1,49.99,4,6),(11,1,250.00,3,7),(12,2,50.00,4,7),(13,3,149.99,1,8),(14,1,129.99,2,9),(15,1,129.99,2,9),(16,1,49.99,3,9),(17,1,129.99,2,10),(18,3,179.99,6,10);
/*!40000 ALTER TABLE `pozycjazamowienia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produkt`
--

DROP TABLE IF EXISTS `produkt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produkt` (
  `id_produkt` int NOT NULL AUTO_INCREMENT,
  `nazwa` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opis` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `cenaBrutto` decimal(10,2) NOT NULL,
  `kategoria` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kolor` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zdjecie` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_produkt`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produkt`
--

LOCK TABLES `produkt` WRITE;
/*!40000 ALTER TABLE `produkt` DISABLE KEYS */;
INSERT INTO `produkt` VALUES (1,'Bluza Oversize Black','Wygodna bluza oversize w kolorze czarnym. Idealna na co dzień.',149.99,'bluzy','czarny','produkty/BluzaCzarnaZKaprutemClassic.png'),(2,'Bluza Hoodie White','Klasyczna bluza z kapturem w kolorze szarym.',129.99,'bluzy','Biały','produkty/BluzaBiałaZKaprutemClassic.png'),(3,'T-shirt Basic White','Biały t-shirt z bawełny organicznej.',49.99,'t-shirty','biały','produkty/KoszulkaBasicWhite.png'),(4,'T-shirt Graphic Black','Czarny t-shirt z graficznym nadrukiem.',69.99,'t-shirty','czarny','produkty/KoszulkaBasicBlack.png'),(5,'Spodnie Cargo Green','Zielone spodnie cargo z wieloma kieszeniami.',199.99,'spodnie','zielony','produkty/SpodnieCargoZielone.png'),(6,'Jeansy Slim Fit','Niebieskie jeansy w kroju slim fit.',179.99,'spodnie','niebieski','produkty/JeansySlimFitwKlasycznymNiebieskimKolorze.png'),(7,'Czapka Beanie Black','Czarna czapka zimowa beanie.',39.99,'akcesoria','czarny','produkty/CzapkaStreetStyleCzarny.png'),(8,'Plecak Street Style','Miejski plecak w stylu streetwear.',249.99,'akcesoria','czarny','produkty/PlecakCityCzarny.png'),(9,'Bluza Zip-Up Navy','Granatowa bluza rozpinana na zamek.',159.99,'bluzy','Czarny','produkty/BluzawStyluStreetwearzNadrukiemLuznyKroj.png'),(10,'Skarpetki','Białe skarpetki 5 par',59.99,'akcesoria','Biały','produkty/SkarpetkiPackBialy.png'),(11,'qqq','ula',200.00,'bluzy','Czarny','');
/*!40000 ALTER TABLE `produkt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rozmiar_produktu`
--

DROP TABLE IF EXISTS `rozmiar_produktu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rozmiar_produktu` (
  `id_rozmiar` int NOT NULL AUTO_INCREMENT,
  `rozmiar` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stanMagazynowy` int NOT NULL,
  `id_produkt` int NOT NULL,
  PRIMARY KEY (`id_rozmiar`),
  UNIQUE KEY `rozmiar_produktu_id_produkt_rozmiar_75d6a015_uniq` (`id_produkt`,`rozmiar`),
  CONSTRAINT `rozmiar_produktu_id_produkt_003b0133_fk_produkt_id_produkt` FOREIGN KEY (`id_produkt`) REFERENCES `produkt` (`id_produkt`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rozmiar_produktu`
--

LOCK TABLES `rozmiar_produktu` WRITE;
/*!40000 ALTER TABLE `rozmiar_produktu` DISABLE KEYS */;
INSERT INTO `rozmiar_produktu` VALUES (1,'XS',13,1),(2,'S',17,1),(3,'M',18,1),(4,'L',6,1),(5,'XL',7,1),(6,'XXL',10,1),(7,'XS',5,2),(8,'S',17,2),(9,'M',17,2),(10,'L',19,2),(11,'XL',27,2),(12,'XXL',7,2),(13,'XS',15,3),(14,'S',19,3),(15,'M',24,3),(16,'L',7,3),(17,'XL',22,3),(18,'XXL',13,3),(19,'XS',15,4),(20,'S',10,4),(21,'M',6,4),(22,'L',23,4),(23,'XL',29,4),(24,'XXL',27,4),(25,'30',7,5),(26,'31',5,5),(27,'32',29,5),(28,'33',15,5),(29,'34',9,5),(30,'36',21,5),(37,'UNI',22,7),(38,'UNI',22,8),(39,'XS',8,9),(40,'S',28,9),(41,'M',23,9),(42,'L',13,9),(43,'XL',14,9),(44,'XXL',25,9),(45,'UNI',6,10),(46,'XS',11,11),(47,'S',27,11),(48,'M',10,11),(49,'L',14,11),(50,'XL',21,11),(51,'XXL',29,11),(52,'30',8,6),(53,'32',28,6),(54,'34',22,6),(55,'36',14,6);
/*!40000 ALTER TABLE `rozmiar_produktu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uzytkownik`
--

DROP TABLE IF EXISTS `uzytkownik`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uzytkownik` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `imie` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nazwisko` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataRejestracji` datetime(6) NOT NULL,
  `statusUzytkownika` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownik`
--

LOCK TABLES `uzytkownik` WRITE;
/*!40000 ALTER TABLE `uzytkownik` DISABLE KEYS */;
INSERT INTO `uzytkownik` VALUES (1,'pbkdf2_sha256$600000$dkvr4w350NAKYFeFDXEM8h$xhgVMb6lZ8yCJFPDLWnwNbJzBG0zJL2duhCuokl7Gs0=',NULL,1,'admin','','',1,1,'2026-04-21 20:09:33.411414','Admin','Sklep','admin@narejonie.pl','2026-04-21 20:09:34.445954','aktywny'),(2,'pbkdf2_sha256$1200000$PnrUFJiNYEocE4CINHABOf$hQSHyKiyvmeVGJmtF+oEP+YuDZ74iQutypik93oGB5E=',NULL,0,'test@test.pl','','',0,1,'2026-04-22 08:19:06.362846','Test','Test','test@test.pl','2026-04-22 08:19:06.806927','aktywny'),(3,'pbkdf2_sha256$600000$6nCnJKRsAXY3Ib6C3ZK0xp$3Lv2MpwlnabF+BJJNSW/JDNmwDVAJTh/qSi053stv4A=',NULL,0,'user@user.pl','','',0,1,'2026-04-22 08:26:05.126858','user','user','user@user.pl','2026-04-22 08:26:05.566207','aktywny'),(4,'pbkdf2_sha256$600000$sy8nKk3KFHBcr9Lvjp9HVE$OqLrFKC0vwj5DmbNe2+UfoDorc7ZliI15I4dmJtBL1c=',NULL,0,'adrian@adrian.pl','','',0,1,'2026-04-22 08:29:50.372217','adrian','adrian','adrian@adrian.pl','2026-04-22 08:29:50.888214','aktywny');
/*!40000 ALTER TABLE `uzytkownik` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uzytkownik_groups`
--

DROP TABLE IF EXISTS `uzytkownik_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uzytkownik_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uzytkownik_groups_user_id_group_id_ac1c99ce_uniq` (`user_id`,`group_id`),
  KEY `uzytkownik_groups_group_id_2413989b_fk_auth_group_id` (`group_id`),
  CONSTRAINT `uzytkownik_groups_group_id_2413989b_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `uzytkownik_groups_user_id_0711e553_fk_uzytkownik_id` FOREIGN KEY (`user_id`) REFERENCES `uzytkownik` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownik_groups`
--

LOCK TABLES `uzytkownik_groups` WRITE;
/*!40000 ALTER TABLE `uzytkownik_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `uzytkownik_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uzytkownik_user_permissions`
--

DROP TABLE IF EXISTS `uzytkownik_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uzytkownik_user_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uzytkownik_user_permissions_user_id_permission_id_32f04696_uniq` (`user_id`,`permission_id`),
  KEY `uzytkownik_user_perm_permission_id_55ec2841_fk_auth_perm` (`permission_id`),
  CONSTRAINT `uzytkownik_user_perm_permission_id_55ec2841_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `uzytkownik_user_permissions_user_id_c371ef4c_fk_uzytkownik_id` FOREIGN KEY (`user_id`) REFERENCES `uzytkownik` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownik_user_permissions`
--

LOCK TABLES `uzytkownik_user_permissions` WRITE;
/*!40000 ALTER TABLE `uzytkownik_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `uzytkownik_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zamowienie`
--

DROP TABLE IF EXISTS `zamowienie`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zamowienie` (
  `id_zamowienie` int NOT NULL AUTO_INCREMENT,
  `dataZlozenia` datetime(6) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kwota` decimal(10,2) NOT NULL,
  `id_uzytkownik` int NOT NULL,
  PRIMARY KEY (`id_zamowienie`),
  KEY `zamowienie_id_uzytkownik_d2799412_fk_uzytkownik_id` (`id_uzytkownik`),
  CONSTRAINT `zamowienie_id_uzytkownik_d2799412_fk_uzytkownik_id` FOREIGN KEY (`id_uzytkownik`) REFERENCES `uzytkownik` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zamowienie`
--

LOCK TABLES `zamowienie` WRITE;
/*!40000 ALTER TABLE `zamowienie` DISABLE KEYS */;
INSERT INTO `zamowienie` VALUES (1,'2026-04-22 09:17:50.818376','zakończone',589.96,4),(2,'2026-04-22 09:18:37.849155','w realizacji',359.98,3),(3,'2026-04-22 09:30:43.533394','zakończone',299.98,3),(4,'2026-04-22 09:30:43.547745','wysłane',89.99,3),(5,'2026-04-22 09:30:43.555878','w realizacji',250.00,3),(6,'2026-04-22 09:30:43.562418','oczekujące',199.98,2),(7,'2026-04-22 09:30:43.571388','anulowane',350.00,2),(8,'2026-04-22 09:30:43.580011','zakończone',449.97,1),(9,'2026-04-22 12:57:55.006819','oczekujące',309.97,4),(10,'2026-04-22 13:54:16.813937','oczekujące',669.96,3);
/*!40000 ALTER TABLE `zamowienie` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zwrot`
--

DROP TABLE IF EXISTS `zwrot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zwrot` (
  `id_zwrot` int NOT NULL AUTO_INCREMENT,
  `powod` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataZgloszenia` datetime(6) NOT NULL,
  `dataAktualizacji` datetime(6) DEFAULT NULL,
  `id_zamowienie` int NOT NULL,
  PRIMARY KEY (`id_zwrot`),
  KEY `zwrot_id_zamowienie_60e1fbf9_fk_zamowienie_id_zamowienie` (`id_zamowienie`),
  CONSTRAINT `zwrot_id_zamowienie_60e1fbf9_fk_zamowienie_id_zamowienie` FOREIGN KEY (`id_zamowienie`) REFERENCES `zamowienie` (`id_zamowienie`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zwrot`
--

LOCK TABLES `zwrot` WRITE;
/*!40000 ALTER TABLE `zwrot` DISABLE KEYS */;
INSERT INTO `zwrot` VALUES (3,'bardzo ważny powód','oczekujący','2026-04-22 10:04:52.457247','2026-04-22 10:04:52.457039',3),(4,'bardzo ważny nie do opisania','oczekujący','2026-04-22 13:31:07.900821','2026-04-22 13:31:07.900673',1);
/*!40000 ALTER TABLE `zwrot` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-22 17:41:46
