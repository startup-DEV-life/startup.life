-- Keep child-side lookups and deletes efficient as player records grow.
create index chat_messages_user_id_idx on public.chat_messages(user_id);
create index chat_reports_reporter_id_idx on public.chat_reports(reporter_id);
create index github_oauth_states_user_id_idx on public.github_oauth_states(user_id);
create index job_completions_user_id_idx on public.job_completions(user_id);
create index learning_book_purchases_book_id_idx on public.learning_book_purchases(book_id);
create index owned_homes_user_id_idx on public.owned_homes(user_id);
create index player_resource_bookmarks_resource_id_idx on public.player_resource_bookmarks(resource_id);
create index player_resource_history_resource_id_idx on public.player_resource_history(resource_id);
create index visits_user_id_idx on public.visits(user_id);
