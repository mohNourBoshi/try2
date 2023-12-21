var d;
fetch("https://gmailreader.onrender.com/read/ramiko963963")
  .then((response) => response.json())
  .then((data) => {
    d = data;
    return d;
  })
  .then((data) => {

        let code = d[0];
        let pure_code = code.body.substring(
            code.body.lastIndexOf("جابر :") + 7
            // ,code.body.lastIndexOf("\n\n\n\n\n")
            );
             console.log(pure_code)

  })
  .catch((error) => console.error("Error:", error));
