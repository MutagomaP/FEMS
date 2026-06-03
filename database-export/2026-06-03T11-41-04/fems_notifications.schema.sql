--
-- PostgreSQL database dump
--

\restrict hwb7AoT2lE1VEhDi30RsaBLXthwWxV7ShNEGYEL5l0qPdcGQ7gzrV1xvLOibWAM

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: notification_deliveries_channel_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_deliveries_channel_enum AS ENUM (
    'EMAIL',
    'SMS'
);


--
-- Name: notification_deliveries_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_deliveries_status_enum AS ENUM (
    'SENT',
    'DELIVERED',
    'FAILED'
);


--
-- Name: notifications_channel_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_channel_enum AS ENUM (
    'EMAIL',
    'SMS'
);


--
-- Name: notifications_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_status_enum AS ENUM (
    'SENT',
    'READ'
);


--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'EXPIRY_90',
    'EXPIRY_60',
    'EXPIRY_30',
    'EXPIRY_7',
    'EXPIRY_0',
    'REMINDER_15',
    'REMINDER_30',
    'WARNING',
    'INSPECTION_SCHEDULED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: notification_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_deliveries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid NOT NULL,
    channel public.notification_deliveries_channel_enum NOT NULL,
    status public.notification_deliveries_status_enum DEFAULT 'SENT'::public.notification_deliveries_status_enum NOT NULL,
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    error_message text
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    extinguisher_id uuid NOT NULL,
    message text NOT NULL,
    type public.notifications_type_enum NOT NULL,
    channel public.notifications_channel_enum NOT NULL,
    status public.notifications_status_enum DEFAULT 'SENT'::public.notifications_status_enum NOT NULL,
    sent_at timestamp with time zone,
    read_at timestamp with time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: notification_deliveries PK_81daeff81f237bd384f7cfc4a4c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "PK_81daeff81f237bd384f7cfc4a4c" PRIMARY KEY (id);


--
-- Name: system_settings PK_b1b5bc664526d375c94ce9ad43d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT "PK_b1b5bc664526d375c94ce9ad43d" PRIMARY KEY (key);


--
-- Name: notifications UQ_b574412f3b0de82a7db5c103d09; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "UQ_b574412f3b0de82a7db5c103d09" UNIQUE (type, extinguisher_id, customer_id);


--
-- Name: notification_deliveries FK_435486b970fffc3e33a7450ee97; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_deliveries
    ADD CONSTRAINT "FK_435486b970fffc3e33a7450ee97" FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hwb7AoT2lE1VEhDi30RsaBLXthwWxV7ShNEGYEL5l0qPdcGQ7gzrV1xvLOibWAM

