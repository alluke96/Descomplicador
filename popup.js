document.getElementById('btnExtrair').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Extrair pergunta (segundo <p> dentro da div)
      const perguntaDiv = document.querySelector('.question__description__text.article-text');
      let pergunta = 'Pergunta não encontrada';

      if (perguntaDiv) {
        // Seleciona o segundo <p> (índice 1, pois a contagem começa em 0)
        const paragrafos = perguntaDiv.querySelectorAll('p');
        if (paragrafos.length >= 2) {
          pergunta = paragrafos[1].textContent.trim(); // Pega o segundo <p>
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
        texto = texto.normalize('NFKC');
        return `${String.fromCharCode(65 + index)}. ${texto}`;
      });

      return { pergunta, alternativas };
    }
  }, ([result]) => {
    const resultadoDiv = document.getElementById('resultado');
    if (result?.result) {
      const { pergunta, alternativas } = result.result;
      const textoFormatado = `PERGUNTA:\n${pergunta}\n\nALTERNATIVAS:\n${alternativas.join('\n')}`;
      
      // Copiar para a área de transferência
      navigator.clipboard.writeText(textoFormatado)
        .then(() => {
          resultadoDiv.innerHTML = "✅ Dados copiados para a área de transferência!<br><br>" +
            `<small>${pergunta}<br><br>${alternativas.join('<br>')}</small>`;
        })
        .catch((err) => {
          resultadoDiv.innerHTML = "🚨 Erro ao copiar!";
        });
    } else {
      resultadoDiv.innerHTML = "🚨 Verifique se está na página correta!";
    }
  });
});