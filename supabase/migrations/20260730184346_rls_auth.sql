-- ============================================================================
-- Migration: 018_auth.sql
-- Description: Connect Supabase Auth with public.users
-- ============================================================================


-- ============================================================================
-- CREATE USER PROFILE AFTER AUTH SIGNUP
-- ============================================================================


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$

BEGIN

INSERT INTO public.users
(
    id,
    email,
    name,
    role,
    tenant_id
)

VALUES
(
    NEW.id,

    NEW.email,

    COALESCE(
        NEW.raw_user_meta_data->>'name',
        'New User'
    ),

    COALESCE(
        NEW.raw_user_meta_data->>'role',
        'EMPLOYEE'
    )::user_role,

    (NEW.raw_user_meta_data->>'tenant_id')::uuid
);


RETURN NEW;

END;

$$;



-- ============================================================================
-- AUTH TRIGGER
-- ============================================================================


CREATE TRIGGER on_auth_user_created

AFTER INSERT ON auth.users

FOR EACH ROW

EXECUTE FUNCTION public.handle_new_user();



-- ============================================================================
-- JWT CLAIMS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)

RETURNS jsonb

LANGUAGE plpgsql

AS $$

DECLARE

    user_record record;

BEGIN


SELECT
    tenant_id,
    role

INTO user_record

FROM public.users

WHERE id =
(event->>'user_id')::uuid;



event :=
jsonb_set(
    event,
    '{claims,tenant_id}',
    to_jsonb(user_record.tenant_id)
);



event :=
jsonb_set(
    event,
    '{claims,role}',
    to_jsonb(user_record.role)
);



RETURN event;


END;

$$;