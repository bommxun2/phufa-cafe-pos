// src/types/customer.ts
import type { PersonBase } from './employee'; // Re-using PersonBase

export type Customer = PersonBase & { // PersonBase already includes optional profileUrl
  point: number;
};

// For forms or when creating a new customer
export type CustomerFormData = Partial<Customer> & { // Customer includes profileUrl from PersonBase
  newCustomer?: boolean; // Flag used in UI
  // citizenId might be editable only on create
};