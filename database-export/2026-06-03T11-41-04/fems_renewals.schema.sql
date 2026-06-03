--
-- PostgreSQL database dump
--

\restrict MI7cQ8S0cFti2oyY1prrSQqoQQjpx10seMNxHaI0RCXjRVVFOeAILFivp27mhGG

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
-- Name: renewal_requests_request_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.renewal_requests_request_type_enum AS ENUM (
    'SERVICE',
    'REPLACEMENT',
    'INSPECTION'
);


--
-- Name: renewal_requests_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.renewal_requests_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'COMPLETED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: renewal_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.renewal_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    extinguisher_id uuid NOT NULL,
    request_type public.renewal_requests_request_type_enum NOT NULL,
    status public.renewal_requests_status_enum DEFAULT 'PENDING'::public.renewal_requests_status_enum NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: renewal_requests PK_36f83c3f56d304cd63e9c38e91f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.renewal_requests
    ADD CONSTRAINT "PK_36f83c3f56d304cd63e9c38e91f" PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict MI7cQ8S0cFti2oyY1prrSQqoQQjpx10seMNxHaI0RCXjRVVFOeAILFivp27mhGG

