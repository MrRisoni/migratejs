
   export function actionA()
   {
    return new Promise(resolve => {
        resolve('A');
    });
   }


   export function actionB()
   {
    return new Promise(resolve => {
        resolve('B');
    });
   }



   export function actionC()
   {
    return new Promise(resolve => {
        resolve('C');
    });
   }



   export function actionD()
   {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('D');
      }, 1000);
    });
   }