-- Create a table for public profiles (if you want to share data publicly)
-- But for settings, we strictly want Row Level Security (RLS) so only the user can see their data.

CREATE TABLE profiles (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    updated_at timestamp with time zone,
    username text,
    avatar_url text,
    website text,
    settings jsonb -- This will store our app settings (endpoints, characters, etc.)
);

-- Set up Row Level Security!
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile." ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup (optional, creates profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content jsonb NOT NULL,
    updated_at bigint NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
    ON sessions FOR DELETE
    USING (auth.uid() = user_id);

CREATE TABLE shared_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users DEFAULT auth.uid(),
    original_session_id uuid,
    original_message_id uuid,
    content jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared sessions are viewable by everyone"
    ON shared_sessions FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own shared sessions"
    ON shared_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared sessions"
    ON shared_sessions FOR DELETE
    USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_shared_sessions_dedup 
    ON shared_sessions(user_id, original_session_id, original_message_id);

