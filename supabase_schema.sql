-- Create User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    currency TEXT DEFAULT 'INR',
    theme TEXT DEFAULT 'system',
    large_expense_threshold NUMERIC DEFAULT 10000,
    local_data_imported BOOLEAN DEFAULT FALSE,
    notified_ids JSONB DEFAULT '[]'::jsonb,
    shown_quote_indexes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    payment_method TEXT,
    source TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
CREATE POLICY "Users can manage their own transactions" ON public.transactions
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SQL Views for Income & Expenses
CREATE OR REPLACE VIEW public.income AS 
    SELECT * FROM public.transactions WHERE type = 'income';

CREATE OR REPLACE VIEW public.expenses AS 
    SELECT * FROM public.transactions WHERE type = 'expense';

-- Debts Table
CREATE TABLE IF NOT EXISTS public.debts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    person_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    remaining_amount NUMERIC NOT NULL,
    reason TEXT,
    due_date TEXT,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own debts" ON public.debts;
CREATE POLICY "Users can manage their own debts" ON public.debts
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Loans Table
CREATE TABLE IF NOT EXISTS public.loans (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lender TEXT NOT NULL,
    original_amount NUMERIC NOT NULL,
    remaining_amount NUMERIC NOT NULL,
    interest NUMERIC,
    due_date TEXT,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own loans" ON public.loans;
CREATE POLICY "Users can manage their own loans" ON public.loans
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Bills Table
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bill_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    due_date TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own bills" ON public.bills;
CREATE POLICY "Users can manage their own bills" ON public.bills
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Purchase Planner Table
CREATE TABLE IF NOT EXISTS public.purchase_planner (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    estimated_cost NUMERIC NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    target_date TEXT,
    notes TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_planner ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own purchase planner" ON public.purchase_planner;
CREATE POLICY "Users can manage their own purchase planner" ON public.purchase_planner
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Priority Purchases Table
CREATE TABLE IF NOT EXISTS public.priority_purchases (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    estimated_cost NUMERIC NOT NULL,
    deadline TEXT NOT NULL,
    priority TEXT NOT NULL,
    notes TEXT,
    purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.priority_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own priority purchases" ON public.priority_purchases;
CREATE POLICY "Users can manage their own priority purchases" ON public.priority_purchases
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    saved_amount NUMERIC NOT NULL,
    remaining_amount NUMERIC NOT NULL,
    deadline TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own savings goals" ON public.savings_goals;
CREATE POLICY "Users can manage their own savings goals" ON public.savings_goals
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Monthly Goals Table
CREATE TABLE IF NOT EXISTS public.monthly_goals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_earned NUMERIC NOT NULL,
    savings_target_amount NUMERIC,
    spending_limit_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own monthly goals" ON public.monthly_goals;
CREATE POLICY "Users can manage their own monthly goals" ON public.monthly_goals
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Trip Planner Table
CREATE TABLE IF NOT EXISTS public.trip_planner (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trip_name TEXT NOT NULL,
    destination TEXT NOT NULL,
    estimated_budget NUMERIC NOT NULL,
    target_travel_date TEXT NOT NULL,
    priority TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    saved_amount NUMERIC NOT NULL,
    expenses JSONB NOT NULL,
    contributions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trip_planner ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own trips" ON public.trip_planner;
CREATE POLICY "Users can manage their own trips" ON public.trip_planner
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Financial Notes Table
CREATE TABLE IF NOT EXISTS public.financial_notes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL,
    pinned BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    reminder_date TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.financial_notes;
CREATE POLICY "Users can manage their own notes" ON public.financial_notes
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    related_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Create automatic profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Priyatham'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
