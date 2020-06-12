
   export function actionA(msg)
   {
    return new Promise(resolve => {
        resolve( msg);
    });
   }




   export function actionB(msg)
   {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve( msg);
      }, 1000);
    });
   }