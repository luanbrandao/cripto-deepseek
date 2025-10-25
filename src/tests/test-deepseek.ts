import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

async function testDeepSeekConnection() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY não encontrada no .env');
    return;
  }

  console.log('🔍 Testando conexão com DeepSeek API...');

  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: 'Olá! Este é um teste de conexão. Responda apenas "Conexão OK".'
        }
      ],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Conexão com DeepSeek estabelecida com sucesso!');
    console.log('📝 Resposta:', response.data.choices[0].message.content);
    console.log('🔧 Modelo:', response.data.model);
    console.log('💰 Tokens usados:', response.data.usage);

  } catch (error: any) {
    console.error('❌ Erro na conexão com DeepSeek:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Erro:', error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testDeepSeekConnection();