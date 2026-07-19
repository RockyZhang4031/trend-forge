const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase 环境变量未配置，数据库功能不可用');
}

// 未配置时返回一个占位对象，避免崩溃
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : {
      _offline: true,
      from: () => ({
        select: () => Promise.reject(new Error('Supabase 未配置')),
        insert: () => Promise.reject(new Error('Supabase 未配置')),
        update: () => Promise.reject(new Error('Supabase 未配置')),
        delete: () => Promise.reject(new Error('Supabase 未配置')),
        eq: () => ({ single: () => Promise.reject(new Error('Supabase 未配置')) }),
        order: () => Promise.reject(new Error('Supabase 未配置')),
      }),
    };

module.exports = supabase;
