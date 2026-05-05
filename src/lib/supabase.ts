import { createClient } from '@supabase/supabase-js';

// Nossa tipagem base para o TypeScript parar de reclamar
export type UserRole = 'trainer' | 'student';

// Conexão com o cofre
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// MOTOR DE CADASTRO (SIGN UP)
// ==========================================
export async function handleSignUp(
  email: string, 
  password: string, 
  name: string, 
  role: UserRole
): Promise<void> {
  
  // 1. Cria a autenticação segura
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error('Erro no cadastro:', authError.message);
    throw authError; // Joga o erro para a tela parar o "loading"
  }

  // 2. Salva o perfil na nossa tabela pública
  if (authData.user) {
    const { error: dbError } = await supabase
      .from('users')
      .insert([
        { 
          id: authData.user.id, 
          name: name, 
          role: role 
        }
      ]);

    if (dbError) {
      console.error('Erro ao salvar perfil:', dbError.message);
      throw dbError;
    } else {
      console.log('Sucesso! Perfil criado no banco.');
    }
  }
}

// ==========================================

export async function handleLogin(email: string, password: string): Promise<UserRole> {
  // 1. Valida a senha
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error('Credenciais inválidas:', authError.message);
    throw authError; 
  }
  
  // 2. Busca a verdadeira identidade no nosso cofre
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();

  if (dbError) {
    console.error('Erro ao buscar perfil real:', dbError.message);
    throw dbError;
  }

  console.log(`Login autorizado. Identidade confirmada como: ${userData.role}`);
  
  // 3. Devolve a role verdadeira para o front-end
  return userData.role as UserRole;
}