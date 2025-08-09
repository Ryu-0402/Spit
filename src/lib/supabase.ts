import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cqqydaaseppdmvcabuns.supabase.co'; // あなたのURL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxcXlkYWFzZXBwZG12Y2FidW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NDA2MDQsImV4cCI6MjA3MDExNjYwNH0.RvzQj92OO39c8vyDlKIrmJYUw0XyWIKOWzjgPbMyhyk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);