class Mutex {
  constructor() {
    let current = Promise.resolve();
    this.lock = () => {
      let rslv;
      const p = new Promise((resolve) => {
        rslv = () => resolve();
      });
      // Caller gets a promise that resolves when the current outstanding
      // lock resolves
      const rv = current.then(() => rslv);
      // Don't allow the next request until the new promise is done
      current = p;
      // Return the new promise
      return rv;
    };
  }
}

export default Mutex;
