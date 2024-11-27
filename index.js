const tokens = {
    'cpp': [
        {
            token: "string",
            regex: /^".*/g,
            color: '#CE9178',
            checkEnd: /^(?!").*"$/g
        },
        {
            token: "directive",
            regex: /#(include)|\busing\b/g,
            color: '#C586B6'
        },
        {
            token: "comment",
            regex: /\/\/.*/g,
            color: '#6A9955',
            fullLine: true
        },
        {
            token: "import",
            regex: /^<.*>/g,
            color: '#CE9178'
        },
        {
            token: "declarative",
            regex: /\b(namespace|const)\b/g,
            color: '#3F9CD6'
        },
        {
            token: "type",
            regex: /\b(int|char|float|double|bool|void|struct)\b/g,
            color: '#3F9CD6'
        },
        {
            token: "terminator",
            regex: /^;$/g,
            color: "#FFFFFF"
        },
        {
            token: "delimiter",
            regex: /^,|^\./g,
            color: "#FFFFFF"
        },
        {
            token: "enclosure",
            regex: /{|}|^\[|^\]|\[\]/g,
            color: "#FFD710"
        },
        {
            token: "template",
            regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*<.*>/g,
            color: '#44C9B0'
        },
        {
            token: "operator",
            regex: /(\+|\-|\*|\/|\=|\%|\&|\||\^|\<\<|\>\>|\(|\)|\<|\>|\!|\:)/g,
            color: "#FFFFFF"
        },
        {
            token: "keyword",
            regex: /\b(return|if|else|while|for|switch|case|break|continue|default)\b/g,
            color: '#C586B6'
        },
        {
            token: "number",
            regex: /\b(\d+|\d+\.\d+)\b/g,
            color: '#B5CE9B'
        },
        {
            token: "function",
            regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
            color: '#DCDC9D',
            checkNext: /\(/g
        },
        {
            token: "variable",
            regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
            color: '#9CDCFE'
        }
    ],
    py: [
        {
            token: "directive",
            regex: /import/g,
            color: '#C586B6'
        },
        {
            token: "operator",
            regex: /(\+|\-|\*|\/|\=|\%|\&|\||\^|\<\<|\>\>|\(|\)|\<|\>|\!|\:)/g,
            color: "#FFFFFF"
        },
        {
            token: "function",
            regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
            color: '#DCDC9D',
            checkNext: /\(/g
        },
        {
            token: "variable",
            regex: /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g,
            color: '#9CDCFE'
        },
    ],
    sql: [
        {
            token: 'data-type',
            regex: /\b(INT|VARCHAR|TEXT|BOOLEAN|DATE|FLOAT|DOUBLE|CHAR|DECIMAL)\b/gi,
            color: '#3BC1FF'
        },
        {
            token: 'number',
            regex: /\b[0-9]+(\.[0-9]+)?\b/g,
            color: '#B5CEA8'
        },
        {
            token: 'operator',
            regex: /(\+|\-|\*|\/|\=|\%|\<|\>|\<=|\>=|\!=)/g,
            color: '#FFFFFF'
        },
        {
            token: "string",
            regex: /(\"[^\"]*\"|\'[^\']*\')/g,
            color: '#CE9178'
        },
        {
            token: "comment",
            regex: /(--[^\n]*|\/\*[\s\S]*?\*\/)/g,
            color: '#6A9955',
            fullLine: true
        },
        {
            token: "keyword",
            regex: /\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|JOIN|INNER|LEFT|RIGHT|FULL|ON|GROUP|BY|HAVING|ORDER|ASC|DESC|LIMIT|DISTINCT|AND|OR|NOT|IN|IS|NULL|LIKE|BETWEEN|UNION|ALL)\b/gi,
            color: '#C586B6'
        },
        {
            token: "function",
            regex: /\b(COUNT|SUM|AVG|MIN|MAX|NOW|COALESCE|LENGTH|SUBSTRING|ROUND|CONCAT|UPPER|LOWER|TRIM)\b/gi,
            color: '#DCDCAA'
        },
        {
            token: "enclosure",
            regex: /(\(|\))/g,
            color: '#FFFFFF'
        },
        {
            token: "constant",
            regex: /\b(TRUE|FALSE|NULL)\b/gi,
            color: '#3BC1FF'
        }
    ]
}

let files = [];
let openFiles = [];
let selectedFile = null;

const sidebar = document.querySelector('.sidebar');
const tabs = document.querySelector('.tabs');

sidebar.addEventListener('dragover', (e) => {
    e.preventDefault();
});


async function UpdateContent(f) {
    const extension = f.name.split(".")[1];

    const code = document.querySelector('.code');
    code.innerHTML = ''; // Limpiar el contenido existente

    try {
        // Procesar contenido con el Worker
        const result = await processWithWorker(f.content);

        // Dividir el contenido procesado por líneas
        const lines = result.split('\n');

        // Función para generar títulos de tokens
        const tokenTitle = (token) => {
            return token.token.replace("-end", "");
        };

        // Función para crear spans coloreados
        const createSpan = (token, word) => {
            const span = document.createElement('span');
            span.style.color = token.color;
            span.title = tokenTitle(token);

            word = word.replaceAll("\t", "    ");

            if (word.includes('<') && word.includes('>')) {
                const [before, after] = word.split(/</);
                span.innerHTML = `${before}<<span style="color:${token.color};">${after}</span>`;
            } else {
                span.innerHTML = word;
            }

            return span;
        };

        // Procesar línea por línea
        lines.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.classList.add('line');

            const pre = document.createElement('pre');
            pre.classList.add('lineContent');

            const words = line.split(' ');
            let globalToken = null;

            for (let i = 0; i < words.length; i++) {
                if (globalToken && globalToken.fullLine) {
                    const content = words.slice(i - 1).join(' ');
                    const span = createSpan(globalToken, content);
                    pre.appendChild(span);
                    globalToken = null;
                    break;
                }

                let word = words[i];
                const splitWords = word.split(/(\/\/|\+|\-|\*|\/|\=|\%|\&|\||\^|\<\<|\>\>|\;|\!|\)|\()/g);

                for (let j = 0; j < splitWords.length; j++) {
                    let splitWord = splitWords[j];

                    for (let t = 0; t < tokens[extension].length; t++) {
                        let testToken = tokens[extension][t];

                        const match = testToken.regex.test(splitWord);

                        if (match == true || match) {
                            testToken.regex.lastIndex = 0;

                            if (testToken.fullLine) {
                                globalToken = testToken;
                                break;
                            } else if (testToken.checkNext) {
                                let nextWord = splitWords[j + 1] ? splitWords[j + 1] : words[i + 1];
                                const nextMatch = testToken.checkNext.test(nextWord);

                                if (nextMatch == true || nextMatch) {
                                    const span = createSpan(testToken, ` ${splitWord}`);
                                    pre.appendChild(span);
                                    break;
                                }
                            } else if (testToken.checkEnd) {
                                let found = false;
                                let endWord = splitWord;

                                const remainingWords = [...splitWords.slice(j + 1), ...words.slice(i + 1)];

                                for (let k = 0; k < remainingWords.length; k++) {
                                    endWord += ` ${remainingWords[k]}`;

                                    const endMatch = testToken.regex.test(remainingWords[k]);
                                    testToken.regex.lastIndex = 0;

                                    if (testToken.checkEnd.test(remainingWords[k]) == true || testToken.checkEnd.test(remainingWords[k])) {
                                        testToken.checkEnd.lastIndex = 0;

                                        if (k < splitWords.length - 1) {
                                            j = k;
                                        } else {
                                            i = i + k + 1;
                                        }

                                        const span = createSpan(testToken, ` ${endWord}`);
                                        pre.appendChild(span);
                                        found = true;
                                        break;
                                    }
                                }

                                if (found) break;
                            } else {
                                const span = createSpan(testToken, ` ${splitWord}`);
                                pre.appendChild(span);
                                break;
                            }
                        } else {
                            if (t == tokens[extension].length - 1 && splitWord.replaceAll(" ", "").replaceAll("\t", "") != "") {
                                const span = document.createElement('span');
                                span.style.color = 'red';
                                span.innerHTML = ` ${splitWord}`;

                                pre.appendChild(span);
                            }
                        }
                    }
                }
            }

            const lineNumber = document.createElement('p');
            lineNumber.classList.add('lineNumber');
            lineNumber.innerHTML = index + 1;

            lineElement.appendChild(lineNumber);
            lineElement.appendChild(pre);

            code.appendChild(lineElement);
        });
    } catch (error) {
        console.error('Error procesando el archivo con el Worker:', error);
    }
}


function langIcon(fileName) {
    return `${
        fileName.endsWith('.cpp') ? (
            `<svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1_856)">
                    <path d="M14.4931 3.54013L8.61535 0.14664C8.27676 -0.04888 7.72262 -0.04888 7.38404 0.14664L1.50628 3.54013C1.16765 3.73561 0.890625 4.21549 0.890625 4.60649V11.3935C0.916968 11.8489 1.14955 12.226 1.50628 12.4599L7.38404 15.8534C7.72262 16.0489 8.27676 16.0489 8.61535 15.8534L14.4931 12.4599C14.8759 12.2053 15.0937 11.8221 15.1088 11.3935V4.60649C15.095 4.19509 14.8486 3.78015 14.4931 3.54013ZM3.26031 8.00002C3.23247 3.37225 9.43091 1.3288 12.1039 5.62885L10.0529 6.81574C8.81469 4.76781 5.74034 5.50007 5.63 8.00002C5.66314 10.3041 8.6848 11.3743 10.053 9.18417L12.1041 10.371C9.74836 14.4605 3.37912 12.9892 3.26031 8.00002ZM12.7391 8.26329H12.2124V8.78992H11.6859V8.26329H11.1593V7.73671H11.6859V7.21013H12.2124V7.73671H12.7391V8.26329ZM14.7138 8.26329H14.1872V8.78992H13.6607V8.26329H13.134V7.73671H13.6607V7.21013H14.1872V7.73671H14.7138V8.26329Z" fill="#1E9CEF"/>
                </g>
                <defs>
                <clipPath id="clip0_1_856">
                <rect width="16" height="16" fill="white"/>
                </clipPath>
                </defs>
            </svg>`
        ) :
        fileName.endsWith('.py') ? (
            `<svg class="icon" width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.03324 14.0596C10.5872 14.0596 10.3652 12.5106 10.3652 12.5106V10.9056H6.96924V10.4236H11.7082C11.7082 10.4236 13.9812 10.6826 13.9812 7.07756C13.9812 3.47256 11.9962 3.60056 11.9962 3.60056H10.8132V5.27356C10.8287 5.53625 10.7892 5.79927 10.6971 6.0458C10.6051 6.29232 10.4626 6.5169 10.2787 6.70517C10.0949 6.89344 9.87376 7.04125 9.62949 7.13912C9.38523 7.237 9.12322 7.28279 8.86024 7.27356H5.49524C5.2487 7.26262 5.00252 7.30222 4.77184 7.38991C4.54116 7.47761 4.33086 7.61155 4.15384 7.78351C3.97683 7.95546 3.83685 8.1618 3.74251 8.38984C3.64816 8.61788 3.60145 8.86281 3.60524 9.10956V12.1966C3.60524 12.1966 3.31824 14.0596 7.03324 14.0596ZM8.90324 12.9806C8.78187 12.9812 8.66306 12.9457 8.56186 12.8787C8.46066 12.8117 8.38162 12.7162 8.33476 12.6042C8.28791 12.4923 8.27534 12.3689 8.29865 12.2498C8.32197 12.1307 8.38011 12.0212 8.46572 11.9352C8.55133 11.8491 8.66055 11.7905 8.77954 11.7666C8.89853 11.7427 9.02194 11.7546 9.13412 11.8009C9.24631 11.8472 9.34223 11.9258 9.40972 12.0267C9.47721 12.1276 9.51324 12.2462 9.51324 12.3676C9.5135 12.4479 9.49792 12.5275 9.4674 12.6018C9.43687 12.6761 9.392 12.7436 9.33534 12.8005C9.27869 12.8575 9.21136 12.9027 9.13721 12.9336C9.06307 12.9645 8.98356 12.9804 8.90324 12.9806Z" fill="#FFCB6B"/>
                <path d="M6.949 0C3.395 0 3.617 1.549 3.617 1.549V3.154H7.013V3.636H2.274C2.274 3.636 0 3.377 0 6.982C0 10.587 1.985 10.459 1.985 10.459H3.169V8.786C3.15352 8.52331 3.19307 8.26029 3.28511 8.01377C3.37715 7.76724 3.51966 7.54266 3.7035 7.35439C3.88735 7.16612 4.10848 7.01832 4.35274 6.92044C4.59701 6.82256 4.85902 6.77677 5.122 6.786H8.487C8.73354 6.79694 8.97972 6.75734 9.21039 6.66965C9.44107 6.58195 9.65138 6.44801 9.82839 6.27605C10.0054 6.1041 10.1454 5.89776 10.2397 5.66972C10.3341 5.44168 10.3808 5.19676 10.377 4.95V1.868C10.377 1.868 10.664 0 6.949 0ZM5.079 1.079C5.20037 1.07841 5.31918 1.11385 5.42038 1.18085C5.52158 1.24784 5.60062 1.34337 5.64747 1.45533C5.69433 1.56729 5.7069 1.69063 5.68358 1.80974C5.66027 1.92885 5.60213 2.03835 5.51652 2.12438C5.43091 2.21041 5.32169 2.2691 5.2027 2.29299C5.08371 2.31689 4.9603 2.30493 4.84811 2.25862C4.73593 2.21231 4.64001 2.13375 4.57252 2.03287C4.50503 1.932 4.469 1.81337 4.469 1.692C4.46874 1.61168 4.48431 1.53209 4.51484 1.4578C4.54536 1.3835 4.59024 1.31595 4.6469 1.25902C4.70355 1.20208 4.77088 1.15688 4.84503 1.12599C4.91917 1.0951 4.99868 1.07913 5.079 1.079Z" fill="#467FBF"/>
            </svg>`
        ) :
        fileName.endsWith('.sql') ? (
            `<svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_1_4108)">
                <path d="M4.66289 8.53773C4.51053 8.79162 4.28608 8.99688 4.16825 9.29665C3.92209 9.82756 4.01733 10.9769 3.86206 10.9788C3.68079 11.0658 3.39512 10.5438 3.27329 10.2327C2.9649 9.44582 2.90761 8.17872 3.17896 7.273C3.55469 6.07812 3.57812 6.14062 3.06123 5.57805C2.58331 4.88051 2.3559 3.749 2.04844 2.94728C1.57715 1.8988 0.466143 1.01766 1.05926 0.620159C1.27263 0.441329 1.98923 0.795816 2.52201 1.14712C2.89837 1.39529 3.14453 1.65871 3.22607 1.65731C4.125 1.63281 4.47656 1.67188 5.93464 2.54268C7.29223 3.46329 8.40219 4.77381 9.16147 6.33711C9.35005 6.99202 10.2604 9.125 10.8808 10.2074C11.041 10.4372 11.6595 10.5605 11.9407 10.688C12.6118 10.9135 12.7422 11.0234 13.6837 11.7505C13.8508 11.877 14.3647 12.1542 14.3903 12.3827C13.5619 12.3586 12.9293 12.4412 12.3884 12.6862C12.2347 12.7559 11.9895 12.7577 11.9645 12.9646C12.0977 13.1094 11.9766 13.3203 12.671 14.0017C13.3774 14.6354 13.7188 14.6875 14.5788 15.1906C15.4029 15.7617 15.4137 15.939 15.5915 16V15.9748C15.4165 15.5617 15.4267 15.6206 15.1205 15.2917C14.0104 13.8021 13.1956 13.9042 12.8594 13.1922C13.7615 12.845 14.2292 12.9688 15.0735 12.661V12.5598C14.5006 11.6511 12.8646 10.3021 11.397 9.82196C10.4588 8.03241 10.0661 6.75967 9.58539 5.72999C8.57497 3.89765 5.90625 0.875 3.48515 1.07548C3.32702 1.00448 3.16249 0.796672 3.01412 0.696035C2.42336 0.295215 0.908057 -0.576625 0.470497 0.569592C0.194215 1.29309 0.883398 1.99912 1.12988 2.36561C1.30291 2.6228 1.52442 2.91114 1.64803 3.20036C1.76903 3.51381 1.73438 3.74609 2.35463 5.27463C2.81316 6.26615 2.89873 5.9752 2.99051 6.33708C2.84507 6.55565 2.83678 6.89494 2.75504 7.17184C2.09375 9.375 3.13121 11.9784 4.14464 11.5481C4.66395 11.3221 4.48935 10.4478 4.70231 9.86485C5.00521 10.4323 5.09896 11.1667 6.4764 12.2817C6.7211 12.4802 6.98334 12.8415 7.29601 12.9555C6.97231 12.7312 6.69418 12.3929 6.42929 12.0287C6.00012 11.4029 5.6208 10.718 5.27526 10.005C4.70906 8.87616 4.82964 8.66211 4.66289 8.53773ZM3.87928 3.37398C3.71875 2.99479 3.65715 3.08194 3.48715 2.89497C3.31644 2.89159 3.19222 2.91899 3.06456 2.9489C3.05755 2.95339 3.0593 2.96259 3.0651 2.97396C3.14651 3.15364 3.31304 3.26922 3.41374 3.42401L3.64656 3.94894C3.81942 3.82505 3.88099 3.62201 3.87928 3.37398Z" fill="#39ADB5"/>
                </g>
                <defs>
                <clipPath id="clip0_1_4108">
                <rect width="16" height="16" fill="white"/>
                </clipPath>
                </defs>
            </svg>`
        ) : (
            `
            <svg class="icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M1.33334 9.33335H5.33334V13.3334H1.33334M10.6667 5.33335H6.66667V6.66669H10.6667M1.33334 6.66669H5.33334V2.66669H1.33334M6.66667 2.66669V4.00002H14.6667V2.66669M6.66667 13.3334H10.6667V12H6.66667M6.66667 10.6667H14.6667V9.33335H6.66667"
                    fill="#fff"
                />
            </svg>
            `
        )
    }`
}

function createTab(f) {
    const tab = document.createElement('div');
    tab.classList.add('tab', 'selected');

    tab.innerHTML = `
        ${langIcon(f.name)}
        <p>${f.name}</p>
        <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M25 7L7 25" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M25 25L7 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    tab.children[2].addEventListener('click', (e) => {
        openFiles = openFiles.filter((file) => file !== f);
        tab.remove();

        if(selectedFile === f) {
            const tabIndex = openFiles.findIndex((file) => file.name === f.name);
        }
    });

    const tabsChildren = Array.from(tabs.children);

    tabsChildren.forEach((child, index) => {
        child.classList.remove('selected');
    });

    tab.addEventListener("click", (e) => {
        const tabsChildren = Array.from(tabs.children);
        const sidebarChildren = Array.from(sidebar.children);

        if(e.target != tab.children[2]) {
            tabsChildren.forEach((child) => {
                if(child === tab) {
                    tab.classList.add('selected');
                } else {
                    child.classList.remove('selected');
                }
            });

            const sidebarChild = files.findIndex((file) => file.name === f.name);

            sidebarChildren.forEach((child, index) => {
                if(index === sidebarChild+1) {
                    child.classList.add('selected');
                } else {
                    child.classList.remove('selected');
                }
            });

            selectedFile = f;
            
            UpdateContent(f);
        }
    });

    tabs.appendChild(tab);
}

function createNewFile(f) {
    const file = document.createElement('div');
    file.classList.add('file');

    file.innerHTML = `
        ${langIcon(f.name)}
        <p>${f.name.substring(0,22)}${f.name.length > 22 ? '...' : ''}</p>
    `;

    file.addEventListener("click", (e) => {
        const sidebarChildren = Array.from(sidebar.children);
        const tabsChildren = Array.from(tabs.children);

        sidebarChildren.forEach((child) => {
            if(child === file) {
                file.classList.add('selected');
            } else {
                child.classList.remove('selected');
            }
        });

        tabsChildren.forEach((child) => {
            if(child.children[1].innerHTML == f.name) {
                child.classList.add('selected');
            } else {
                child.classList.remove('selected');
            }
        })

        selectedFile = f;

        if(!openFiles.includes(f)) {
            openFiles.push(f);

            createTab(f);
        };

        UpdateContent(f);
    });

    sidebar.appendChild(file);
}

sidebar.addEventListener('drop', (e) => {
    e.preventDefault();

    const uploadedFiles = e.dataTransfer.files;

    for (let i = 0; i < uploadedFiles.length; i++) {
        const reader = new FileReader();

        if(files.find((file) => file.name === uploadedFiles[i].name)) {
            alert(`El archivo ${uploadedFiles[i].name} ya ha sido cargado`);
            continue;
        }

        reader.onload = (e) => {
            const fileContent = e.target.result;

            const fileObject = {
                name: uploadedFiles[i].name,
                content: fileContent
            }

            files.push(fileObject);

            createNewFile(fileObject);
        }

        reader.readAsText(uploadedFiles[i]);
    }
});

// Verifica si el navegador soporta Workers
if (window.Worker) {
    const myWorker = new Worker('worker.js');

    // Procesar contenido con el Worker
    function processWithWorker(content) {
        return new Promise((resolve, reject) => {
            myWorker.postMessage({ data: content });

            // Recibir respuesta del Worker
            myWorker.onmessage = function(event) {
                resolve(event.data.result);
            };

            myWorker.onerror = function(error) {
                reject(error);
            };
        });
    }
}


