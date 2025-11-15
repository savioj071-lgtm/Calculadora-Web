function calcularExpressao(expressionString) {
    try {
        const tokens = tokenizar(expressionString);
        const rpnTokens = infixToRpn(tokens);
        const resultado = avaliarRpn(rpnTokens);

        if (typeof resultado === 'number' && !Number.isInteger(resultado)) {
             return parseFloat(resultado.toFixed(8));
        }

        return resultado;
    } catch (error) {
        console.error("Erro no cálculo:", error.message);
        return "Erro";
    }
}

function tokenizar(expression) {
    const regex = /(\d+\.?\d*|\.\d+|[+\-*/()])/g;
    
    let safeExpression = expression.trim();
    if (safeExpression.startsWith('-')) {
        safeExpression = '0' + safeExpression;
    }
    safeExpression = safeExpression.replace(/\(-\s*/g, '(0-');

    const tokens = safeExpression.match(regex);

    if (!tokens) {
        throw new Error("Expressão inválida");
    }
    return tokens;
}

function infixToRpn(tokens) {
    const filaSaida = [];
    const pilhaOperadores = [];

    const precedencia = {
        '*': 2,
        '/': 2,
        '+': 1,
        '-': 1
    };

    const isOperador = (token) => ['+', '-', '*', '/'].includes(token);
    const isNumero = (token) => !isNaN(parseFloat(token));

    for (const token of tokens) {
        if (isNumero(token)) {
            filaSaida.push(token);
        }
        else if (isOperador(token)) {
            while (
                pilhaOperadores.length > 0 &&
                isOperador(pilhaOperadores[pilhaOperadores.length - 1]) &&
                precedencia[pilhaOperadores[pilhaOperadores.length - 1]] >= precedencia[token]
            ) {
                filaSaida.push(pilhaOperadores.pop());
            }
            pilhaOperadores.push(token);
        }
        else if (token === '(') {
            pilhaOperadores.push(token);
        }
        else if (token === ')') {
            while (pilhaOperadores.length > 0 && pilhaOperadores[pilhaOperadores.length - 1] !== '(') {
                filaSaida.push(pilhaOperadores.pop());
            }

            if (pilhaOperadores.length === 0) {
                throw new Error("Parênteses desbalanceados");
            }

            pilhaOperadores.pop();
        }
    }

    while (pilhaOperadores.length > 0) {
        const op = pilhaOperadores.pop();
        if (op === '(') {
            throw new Error("Parênteses desbalanceados");
        }
        filaSaida.push(op);
    }

    return filaSaida;
}

function avaliarRpn(rpnTokens) {
    const pilha = [];

    for (const token of rpnTokens) {
        if (!isNaN(parseFloat(token))) {
            pilha.push(parseFloat(token));
        } else {
            if (pilha.length < 2) {
                throw new Error("Expressão mal formada");
            }
            const b = pilha.pop();
            const a = pilha.pop();

            switch (token) {
                case '+':
                    pilha.push(a + b);
                    break;
                case '-':
                    pilha.push(a - b);
                    break;
                case '*':
                    pilha.push(a * b);
                    break;
                case '/':
                    if (b === 0) {
                        throw new Error("Divisão por zero");
                    }
                    pilha.push(a / b);
                    break;
                default:
                    throw new Error("Operador desconhecido: " + token);
            }
        }
    }

    if (pilha.length !== 1) {
        throw new Error("Expressão mal formada");
    }

    return pilha[0];
}

document.addEventListener('DOMContentLoaded', () => {
    
    const visor = document.getElementById('visor');
    const botoes = document.querySelectorAll('.btn-calc'); 
    const btnIgual = document.getElementById('btn-igual');
    const btnLimpar = document.getElementById('btn-limpar');
    const btnApagar = document.getElementById('btn-apagar');
    const btnToggleLog = document.getElementById('btn-toggle-log');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            adicionarAoVisor(btn.dataset.valor); 
        });
    });

    btnLimpar.addEventListener('click', limparVisor);
    btnApagar.addEventListener('click', apagarUltimo);
    btnIgual.addEventListener('click', calcular);
    btnToggleLog.addEventListener('click', toggleLog);
});

function adicionarAoVisor(valor) {
    const visor = document.getElementById('visor');

    if (visor.value === "Erro" || visor.value === "Infinity") {
        visor.value = "";
    }

    if (valor === '.') {
        const partes = visor.value.split(/[+\-*/()]/);
        const ultimoNumero = partes[partes.length - 1];
        if (ultimoNumero.includes('.')) {
            return;
        }
    }
    
    visor.value += valor;
}

function limparVisor() {
    const visor = document.getElementById('visor');
    visor.value = '';
}

function apagarUltimo() {
    const visor = document.getElementById('visor');
    visor.value = visor.value.slice(0, -1);
}

function calcular() {
    const visor = document.getElementById('visor');
    const expressao = visor.value;

    if (!expressao) return;

    const resultado = calcularExpressao(expressao);

    visor.value = resultado;

    if (String(resultado) !== "Erro" && String(resultado) !== "Infinity") {
        salvarNoLog(expressao, resultado);
    }
}

function salvarNoLog(expressao, resultado) {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR');
    const horaFormatada = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const logEntry = `[${dataFormatada} ${horaFormatada}] ${expressao} = ${resultado}`;

    let logs = JSON.parse(localStorage.getItem('calculadora_logs')) || [];

    logs.unshift(logEntry);

    if (logs.length > 50) {
        logs.pop();
    }

    localStorage.setItem('calculadora_logs', JSON.stringify(logs));
}

function toggleLog() {
    const logContainer = document.getElementById('log-container');
    const btnToggleLog = document.getElementById('btn-toggle-log');

    const estaVisivel = logContainer.style.display === 'block';

    if (estaVisivel) {
        logContainer.style.display = 'none';
        btnToggleLog.textContent = 'Ver Histórico';
    } else {
        logContainer.style.display = 'block';
        btnToggleLog.textContent = 'Esconder Histórico';
        carregarLogs();
    }
}

function carregarLogs() {
    const logLista = document.getElementById('log-lista');
    const logs = JSON.parse(localStorage.getItem('calculadora_logs')) || [];

    logLista.innerHTML = '';

    if (logs.length === 0) {
        logLista.innerHTML = '<li>Nenhum histórico salvo.</li>';
        return;
    }

    logs.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = entry;
        logLista.appendChild(li);
    });
}