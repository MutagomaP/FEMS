--
-- PostgreSQL database dump
--

\restrict WgO0saIFc2WzDolcakTuMwrPIhRny6w34WDLxCFMAnD1RRIg7QglluCbK2jU6ZH

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
-- Name: fire_extinguishers_size_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fire_extinguishers_size_enum AS ENUM (
    '2.5_LB',
    '5_LB',
    '9_LB',
    '12_LB'
);


--
-- Name: fire_extinguishers_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fire_extinguishers_status_enum AS ENUM (
    'ACTIVE',
    'EXPIRING_SOON',
    'EXPIRED',
    'RENEWED',
    'IN_STOCK'
);


--
-- Name: fire_extinguishers_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.fire_extinguishers_type_enum AS ENUM (
    'WATER',
    'CO2',
    'FOAM',
    'DRY_CHEMICAL'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extinguisher_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.extinguisher_audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(64) NOT NULL,
    entity_id uuid NOT NULL,
    details text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fire_extinguishers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fire_extinguishers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    serial_number character varying(100) NOT NULL,
    type public.fire_extinguishers_type_enum NOT NULL,
    expiry_date date NOT NULL,
    status public.fire_extinguishers_status_enum DEFAULT 'ACTIVE'::public.fire_extinguishers_status_enum NOT NULL,
    customer_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    location character varying(255) NOT NULL,
    installation_date date NOT NULL,
    size public.fire_extinguishers_size_enum NOT NULL
);


--
-- Name: fire_extinguishers PK_09b3c7167d7e7257325e239a58b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_extinguishers
    ADD CONSTRAINT "PK_09b3c7167d7e7257325e239a58b" PRIMARY KEY (id);


--
-- Name: extinguisher_audit_logs PK_9d25e299e5c19e6b9f84804b926; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.extinguisher_audit_logs
    ADD CONSTRAINT "PK_9d25e299e5c19e6b9f84804b926" PRIMARY KEY (id);


--
-- Name: fire_extinguishers UQ_1f7b4d485e4ee3f5f0f4643eda1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fire_extinguishers
    ADD CONSTRAINT "UQ_1f7b4d485e4ee3f5f0f4643eda1" UNIQUE (serial_number);


--
-- Name: idx_extinguisher_audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_extinguisher_audit_entity ON public.extinguisher_audit_logs USING btree (entity_id);


--
-- Name: idx_fire_extinguishers_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fire_extinguishers_customer_id ON public.fire_extinguishers USING btree (customer_id);


--
-- Name: idx_fire_extinguishers_expiry_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fire_extinguishers_expiry_date ON public.fire_extinguishers USING btree (expiry_date);


--
-- PostgreSQL database dump complete
--

\unrestrict WgO0saIFc2WzDolcakTuMwrPIhRny6w34WDLxCFMAnD1RRIg7QglluCbK2jU6ZH

