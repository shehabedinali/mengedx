/** Roles that appear in the Staff management list */
export const STAFF_FETCH_ROLES = [
    'Manager',
    'Dispatcher',
    'Cashier',
] as const;

export const STAFF_ROLE_COLORS: Record<string, string> = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Manager: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    Dispatcher: 'bg-orange-100 text-orange-700 border-orange-200',
    Cashier: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export const ROLE_HINTS: Record<string, string> = {
    Admin: 'Full access to company operations and management tools.',
    Manager: 'Manages company operations, staff, and trip coordination.',
    Dispatcher: 'Handles dispatching, routes, and live trip operations.',
    Cashier: 'Handles cashier and payment desk responsibilities.',
};

export function getStaffRolesForUser(role?: string | null): readonly string[] {
    const normalized = role?.toLowerCase();

    if (normalized === 'superadmin') {
        return ['Admin', 'Manager', 'Dispatcher', 'Cashier'];
    }

    if (normalized === 'admin') {
        return ['Manager', 'Dispatcher', 'Cashier'];
    }

    if (normalized === 'manager') {
        return ['Dispatcher', 'Cashier'];
    }

    return ['Cashier'];
}

/** Returns true for Dispatcher role (case-insensitive) */
export function isDispatcherRole(role?: string | null): boolean {
    return role?.toLowerCase() === 'dispatcher';
}

/** Returns true for Cashier role (case-insensitive) */
export function isCashierRole(role?: string | null): boolean {
    return role?.toLowerCase() === 'cashier';
}

/** Returns true for Manager role (case-insensitive) */
export function isManagerRole(role?: string | null): boolean {
    return role?.toLowerCase() === 'manager';
}

/** Returns true for SuperAdmin role (case-insensitive) */
export function isSuperAdminRole(role?: string | null): boolean {
    return role?.toLowerCase() === 'superadmin';
}

/** Returns true for Admin role (case-insensitive) */
export function isAdminRole(role?: string | null): boolean {
    return role?.toLowerCase() === 'admin';
}
