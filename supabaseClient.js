import { createClient } from "@supabase/supabase-js";   

const supabaseUrl = "https://omtvjepuagqcditepmfo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdHZqZXB1YWdxY2RpdGVwbWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTgxMDAsImV4cCI6MjA3NzQ5NDEwMH0.oEfhWawe09fTHqU-rwpJzwkdbbpNxp68nxxjRrpaguk";

export const supabase = createClient(supabaseUrl, supabaseKey);