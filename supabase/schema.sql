    -- Create a table for public profiles (if you want to share data publicly)
    -- But for settings, we strictly want Row Level Security (RLS) so only the user can see their data.

    create table profiles (
    id uuid references auth.users not null primary key,
    updated_at timestamp with time zone,
    username text,
    avatar_url text,
    website text,
    settings jsonb -- This will store our app settings (endpoints, characters, etc.)
    );

    -- Set up Row Level Security!
    alter table profiles enable row level security;

    create policy "Users can view their own profile." on profiles
    for select using (auth.uid() = id);

    create policy "Users can insert their own profile." on profiles
    for insert with check (auth.uid() = id);

    create policy "Users can update their own profile." on profiles
    for update using (auth.uid() = id);

    -- Function to handle new user signup (optional, creates profile automatically)
    create or replace function public.handle_new_user() 
    returns trigger as $$
    begin
    insert into public.profiles (id, username, avatar_url)
    values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    return new;
    end;
    $$ language plpgsql security definer;

    -- Trigger to call the function on new user creation
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
