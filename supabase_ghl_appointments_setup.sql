-- Rode isso uma vez no SQL Editor do Supabase (projeto acmunetcydjrdjwdgsoh)
-- para criar a tabela que recebe os agendamentos de Onboarding do GHL,
-- usada para detectar duplicidade (mesmo cliente com mais de um agendamento ativo).

create table if not exists ghl_appointments (
  appointment_id text primary key,   -- id do compromisso no GHL (evita duplicar linha)
  cs_email text not null,            -- e-mail da CS responsável (assigned user)
  client_email text,
  client_name text,
  start_time timestamptz,
  status text,                       -- ex: reservado, compareceu, não compareceu, cancelado, reagendado
  calendar jsonb,                    -- objeto "calendar" inteiro que o GHL manda automaticamente
                                      -- (dados padrão); usamos calendar->>'appoinmentStatus' como status real
  updated_at timestamptz not null default now()
);

create index if not exists ghl_appointments_client_idx on ghl_appointments (client_email);

alter table ghl_appointments enable row level security;

-- Mesmo modelo de acesso que a kv_store já usa hoje (chave anon pública).
create policy "ghl_appointments anon insert" on ghl_appointments
  for insert to anon with check (true);

create policy "ghl_appointments anon update" on ghl_appointments
  for update to anon using (true);

create policy "ghl_appointments anon select" on ghl_appointments
  for select to anon using (true);
