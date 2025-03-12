document.getElementById('btnExtrair').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const loading = document.getElementById('loading');
  const resultadoDiv = document.getElementById('resultado');
  const respostaIA = document.getElementById('resposta-ia');
  const btn = document.getElementById('btnExtrair');

  // Resetar elementos
  btn.style.display = 'none';
  loading.style.display = 'flex';
  resultadoDiv.style.display = 'none';
  respostaIA.style.display = 'none';

  // Extrair dados
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Extrair pergunta (segundo <p>)
      const perguntaDiv = document.querySelector('.question__description__text.article-text');
      let pergunta = 'Pergunta não encontrada';
      if (perguntaDiv) {
        const paragrafos = perguntaDiv.querySelectorAll('p');
        if (paragrafos.length >= 2) {
          pergunta = paragrafos[1].textContent.trim();
        }
      }

      // Extrair alternativas
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
  }, ([result]) => {
    // Processar resultado
    if (result?.result) {
      const { pergunta, alternativas } = result.result;
      const textoFormatado = `PERGUNTA:\n${pergunta}\n\nALTERNATIVAS:\n${alternativas.join('\n')}`;
      
      // Copiar para área de transferência
      navigator.clipboard.writeText(textoFormatado)
        .then(() => {
          resultadoDiv.innerHTML = `✅ Copiado para área de transferência!<br><br>
            <small><strong>PERGUNTA:</strong><br>${pergunta}<br><br>
            <strong>ALTERNATIVAS:</strong><br>${alternativas.join('<br>')}</small>`;
        })
        .catch(console.error);
    }
  });

  // Simular IA após 5 segundos
  setTimeout(() => {
    loading.style.display = 'none';
    resultadoDiv.style.display = 'block';
    respostaIA.style.display = 'block';
    btn.style.display = 'block';
  }, 5000);
});