-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title character varying NOT NULL,
  last_updated timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_pkey PRIMARY KEY (uuid),
  CONSTRAINT chat_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.event (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_chat_id uuid,
  title character varying NOT NULL,
  description text,
  urgency USER-DEFINED DEFAULT 'medium'::event_urgency,
  status USER-DEFINED DEFAULT 'pending'::event_status,
  start_timestamp timestamp with time zone,
  end_timestamp timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_pkey PRIMARY KEY (uuid),
  CONSTRAINT event_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT event_source_chat_id_fkey FOREIGN KEY (source_chat_id) REFERENCES public.chat(uuid)
);
CREATE TABLE public.message (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'system'::message_role,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT message_pkey PRIMARY KEY (uuid),
  CONSTRAINT message_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chat(uuid)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  email text UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);