
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rynanoqbalncsknembks.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5bmFub3FiYWxuY3NrbmVtYmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2NDYyNzUsImV4cCI6MjA1OTIyMjI3NX0.pT5O3C6VAc7j11MR7dRT5NFyC9w3O_cAdFhHZCSZDrw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
