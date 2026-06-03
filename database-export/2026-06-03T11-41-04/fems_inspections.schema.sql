--
-- PostgreSQL database dump
--

\restrict 6dDGnZxQVhIY5CqnYyUI3neUwF4xqp2Vw4MLQEs6RkWHsEEhPGRgRATInihi2xv

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
-- Name: inspection_schedules_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.inspection_schedules_status_enum AS ENUM (
    'PENDING',
    'COMPLETED',
    'OVERDUE',
    'CANCELLED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: inspection_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inspection_schedules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    extinguisher_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    scheduled_by_user_id uuid NOT NULL,
    inspector_user_id uuid,
    inspection_date date NOT NULL,
    inspection_time character varying(5) NOT NULL,
    status public.inspection_schedules_status_enum DEFAULT 'PENDING'::public.inspection_schedules_status_enum NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    extinguisher_id uuid NOT NULL,
    inspector_user_id uuid NOT NULL,
    action_taken character varying(255) NOT NULL,
    maintenance_date date NOT NULL,
    issues_identified text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    recommendations text
);


--
-- Name: maintenance_logs PK_096e4b6bb7c9fe74d960e7523e4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT "PK_096e4b6bb7c9fe74d960e7523e4" PRIMARY KEY (id);


--
-- Name: inspection_schedules PK_6051c191b575b13df81a785901d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inspection_schedules
    ADD CONSTRAINT "PK_6051c191b575b13df81a785901d" PRIMARY KEY (id);


--
-- Name: idx_inspection_schedules_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inspection_schedules_date ON public.inspection_schedules USING btree (inspection_date);


--
-- Name: idx_inspection_schedules_extinguisher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inspection_schedules_extinguisher ON public.inspection_schedules USING btree (extinguisher_id);


--
-- Name: idx_maintenance_logs_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_logs_date ON public.maintenance_logs USING btree (maintenance_date);


--
-- Name: idx_maintenance_logs_extinguisher; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_maintenance_logs_extinguisher ON public.maintenance_logs USING btree (extinguisher_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6dDGnZxQVhIY5CqnYyUI3neUwF4xqp2Vw4MLQEs6RkWHsEEhPGRgRATInihi2xv

