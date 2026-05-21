-- Run AFTER setup-v3.sql in Supabase SQL Editor
-- Adds: platform_reviews table

create table if not exists platform_reviews (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  platform_id uuid references platforms(id) on delete cascade not null,
  rating      int not null check (rating between 1 and 5),
  review_text text not null check (length(review_text) >= 20 and length(review_text) <= 300),
  created_at  timestamptz default now(),
  unique(user_id, platform_id)   -- one review per member per platform
);

alter table platform_reviews enable row level security;

create policy "reviews readable by all members" on platform_reviews for select using (true);
create policy "own review insert" on platform_reviews for insert with check (auth.uid() = user_id);
create policy "own review update" on platform_reviews for update using (auth.uid() = user_id);
create policy "own review delete" on platform_reviews for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
