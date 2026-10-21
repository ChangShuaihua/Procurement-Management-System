create table public.org_unit (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  parent_id uuid references public.org_unit (id),
  type text not null check (type in ('company', 'department')),
  address text,
  can_be_party_a boolean not null default false,
  status text not null check (status in ('active', 'inactive'))
);

create index org_unit_parent_id_idx on public.org_unit (parent_id);
