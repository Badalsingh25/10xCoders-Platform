require('dotenv').config();
const ILovePDFApi = require('@ilovepdf/ilovepdf-nodejs');
const TaskBaseProcess = require('@ilovepdf/ilovepdf-js-core/tasks/TaskBaseProcess').default;

class GenericTask extends TaskBaseProcess {
    constructor(auth, xhr, toolName) {
        super(auth, xhr, {});
        this.type = toolName;
    }
}

async function test() {
    const ilovepdf = new ILovePDFApi(
        process.env.ILOVEAPI_PUBLIC_KEY,
        process.env.ILOVEAPI_SECRET_KEY
    );

    const tools = [
        'pdfword', 'pdf-word', 'pdf_word', 'pdf2word', 'pdftoword', 'pdf-to-word',
        'pdfpowerpoint', 'pdfppt', 'pdf-powerpoint', 'pdf-ppt', 'pdf_ppt', 'pdf_powerpoint',
        'pdfexcel', 'pdf-excel', 'pdf_excel', 'pdf2excel',
        'officepdf'
    ];

    console.log('Probing tool names...');

    for (const tool of tools) {
        try {
            const task = new GenericTask(ilovepdf.auth, ilovepdf.xhr, tool);
            await task.start();
            console.log(`[PASS] ${tool}`);
        } catch (e) {
            let msg = e.message;
            if (e.response && e.response.data && e.response.data.error) {
                msg = e.response.data.error.message || msg;
                if (e.response.data.error.param && e.response.data.error.param.tool) {
                    msg = e.response.data.error.param.tool[0];
                }
            }
            console.log(`[FAIL] ${tool}: ${msg}`);
        }
    }
}

test();
