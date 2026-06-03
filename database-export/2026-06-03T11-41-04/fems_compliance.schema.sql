--
-- PostgreSQL database dump
--

\restrict K9iC9KQzVxtKjKXRlvtBSHvufUF9a3yBxs455NMW3P4gLENVNKflxLKwmfYoA9B

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
-- Name: compliance_cases_case_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.compliance_cases_case_status_enum AS ENUM (
    'OPEN',
    'WARNING_SENT',
    'FINAL_WARNING',
    'ESCALATED',
    'CLOSED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: compliance_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.compliance_cases (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    extinguisher_id uuid NOT NULL,
    case_status public.compliance_cases_case_status_enum DEFAULT 'OPEN'::public.compliance_cases_case_status_enum NOT NULL,
    closed_at timestamp with time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: compliance_cases PK_62e9378bdd51f534684978cf3b1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.compliance_cases
    ADD CONSTRAINT "PK_62e9378bdd51f534684978cf3b1" PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict K9iC9KQzVxtKjKXRlvtBSHvufUF9a3yBxs455NMW3P4gLENVNKflxLKwmfYoA9B

