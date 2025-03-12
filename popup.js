document.getElementById('btnExtrair').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const loading = document.getElementById('loading');
  const resultadoDiv = document.getElementById('resultado');
  const respostaIA = document.getElementById('resposta-ia');
  const btn = document.getElementById('btnExtrair');

  // ============ COLE SUA API KEY AQUI ============
  const GEMINI_API_KEY = 'SUA_API_KEY'; 
  // Obtenha em: https://aistudio.google.com/app/apikey
  // ===============================================

  btn.style.display = 'none';
  loading.style.display = 'flex';
  resultadoDiv.style.display = 'none';
  respostaIA.style.display = 'none';

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const perguntaDiv = document.querySelector('.question__description__text.article-text');
      let pergunta = 'Pergunta não encontrada';

      if (perguntaDiv) {
        // Procura pelo elemento que contém o texto real (span com style específico)
        const spanPergunta = perguntaDiv.querySelector('span[style*="font-size:20px"][style*="color:black"]');
        
        // Se não encontrar pelo span, procura em qualquer elemento com texto relevante
        if (spanPergunta) {
          pergunta = spanPergunta.textContent.replace(/\u200B/g, '').trim();
        } else {
          // Fallback: Procura o primeiro elemento não vazio
          const elementos = perguntaDiv.querySelectorAll('*');
          for (const el of elementos) {
            if (el.textContent.trim().length > 10) { // 10 caracteres como limite mínimo
              pergunta = el.textContent.replace(/\u200B/g, '').trim();
              break;
            }
          }
        }
      }

      const alternativas = Array.from(
        document.querySelectorAll('.question__alternatives .question__alternative.p1')
      ).map((li, index) => {
        const textoElement = li.querySelector('.article-text p');
        let texto = textoElement ? 
          textoElement.textContent.replace(/^[\u200B]+|[\u200B]+$/g, '').trim() : 
          'Alternativa não encontrada';
        return `${String.fromCharCode(65 + index)}. ${texto}`;
      });

      return { pergunta, alternativas };
    }
  }, async ([result]) => {
    if (!result?.result) {
      loading.style.display = 'none';
      resultadoDiv.innerHTML = 'Erro ao extrair dados da questão';
      return;
    }

    const { pergunta, alternativas } = result.result;
    const textoFormatado = `PERGUNTA:\n${pergunta}\n\nALTERNATIVAS:\n${alternativas.join('\n')}`;
    
    try {
      // Copiar para área de transferência
      await navigator.clipboard.writeText(textoFormatado);
      resultadoDiv.innerHTML = `✅ Copiado para área de transferência!<br><br>
        <small><strong>PERGUNTA:</strong><br>${pergunta}<br><br>
        <strong>ALTERNATIVAS:</strong><br>${alternativas.join('<br>')}</small>`;

      // Chamar API do Gemini
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analise esta questão e suas alternativas, e me de apenas a resposta correta, de forma prática e rápida, assinalando a alternativa logo no começo da sua resposta:\n\n${textoFormatado}`
            }]
          }]
        })
      });

      const data = await response.json();
      const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Resposta não encontrada';

      function formatarResposta(texto) {
        return texto
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/(\d+\.|\-\s)/g, '<br>$1')
          .replace(/\n/g, '<br>');
      }
      
      respostaIA.innerHTML = `<strong>Resposta da IA:</strong><br>${formatarResposta(resposta)}`;
      
    } catch (error) {
      respostaIA.innerHTML = 'Erro ao consultar a IA';
      console.error(error);
    } finally {
      loading.style.display = 'none';
      resultadoDiv.style.display = 'block';
      respostaIA.style.display = 'block';
      btn.style.display = 'block';
    }
  });
});