-- Petal & Bloom — run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.order_status as enum (
    'pending_payment',
    'paid',
    'failed',
    'cancelled',
    'fulfilled'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  category text not null default 'skincare',
  price_kes integer not null check (price_kes > 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  status public.order_status not null default 'pending_payment',
  total_kes integer not null check (total_kes > 0),
  phone text not null,
  checkout_request_id text unique,
  merchant_request_id text,
  mpesa_receipt text,
  result_code text,
  result_desc text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  unit_price_kes integer not null,
  quantity integer not null check (quantity > 0)
);

create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);
create index if not exists products_active_idx on public.products (is_active, category);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.place_order(p_items jsonb, p_phone text)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_total integer := 0;
  v_qty integer;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_phone is null or length(trim(p_phone)) < 10 then
    raise exception 'A valid M-Pesa phone number is required';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'Cart is empty';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_qty < 1 then
      raise exception 'Invalid quantity';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
    for update;

    if not found or v_product.is_active is not true then
      raise exception 'A product in your cart is no longer available';
    end if;

    if v_product.stock < v_qty then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_total := v_total + (v_product.price_kes * v_qty);
  end loop;

  insert into public.orders (user_id, status, total_kes, phone)
  values (v_user, 'pending_payment', v_total, p_phone)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    update public.products
      set stock = stock - v_qty, updated_at = now()
      where id = (v_item->>'product_id')::uuid;

    insert into public.order_items (order_id, product_id, product_name, unit_price_kes, quantity)
    select v_order.id, p.id, p.name, p.price_kes, v_qty
    from public.products p
    where p.id = (v_item->>'product_id')::uuid;
  end loop;

  return v_order;
end;
$$;

create or replace function public.restore_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products p
  set stock = p.stock + i.quantity, updated_at = now()
  from public.order_items i
  where i.order_id = p_order_id
    and i.product_id = p.id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert with check (public.is_admin());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update using (public.is_admin());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete using (public.is_admin());

drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

grant execute on function public.place_order(jsonb, text) to authenticated;
grant execute on function public.is_admin() to authenticated, anon;
grant execute on function public.restore_order_stock(uuid) to service_role;

grant usage on schema public to anon, authenticated;
grant select on table public.products to anon, authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, update on table public.orders to authenticated;
grant select on table public.order_items to authenticated;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

insert into public.products (name, slug, description, category, price_kes, stock, image_url)
values
  (
    'Rosewater Silk Serum',
    'rosewater-silk-serum',
    'A lightweight botanical serum with Damask rose, hyaluronic dew, and baobab oil. Leaves skin glass-soft without heaviness.',
    'skincare',
    2450,
    24,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Hibiscus Glow Oil',
    'hibiscus-glow-oil',
    'Cold-pressed hibiscus and marula restore radiance. A few drops at dusk, a lit-from-within finish by morning.',
    'skincare',
    3200,
    18,
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Peony Cloud Blush',
    'peony-cloud-blush',
    'A whipped cream blush in warm petal pink. Buildable, blendable, and kind to melanin-rich skin.',
    'makeup',
    1850,
    30,
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Jasmine Night Perfume',
    'jasmine-night-perfume',
    'Night-blooming jasmine, vanilla orchid, and a whisper of sandalwood. Lasts from last light to last dance.',
    'fragrance',
    5600,
    12,
    'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Shea Petal Body Soufflé',
    'shea-petal-body-souffle',
    'Whipped shea, coconut milk, and geranium. Melts in, never greasy — East African botanicals, Parisian texture.',
    'body',
    2100,
    40,
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80'
  ),
  (
    'Gardenia Hair Elixir',
    'gardenia-hair-elixir',
    'A shine oil for coils, waves, and silk presses. Gardenia, rosemary, and camellia seal moisture without crunch.',
    'hair',
    1950,
    22,
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80'
  )
on conflict (slug) do nothing;

-- After you create your admin account in Authentication, promote it:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
