const fs = require('fs');
let content = fs.readFileSync('src/data.ts', 'utf8');
content = content.replace(/'Active'/g, "'Đang hoạt động'")
                 .replace(/'On Leave'/g, "'Nghỉ phép'")
                 .replace(/'Terminated'/g, "'Đã nghỉ việc'");
fs.writeFileSync('src/data.ts', content);
