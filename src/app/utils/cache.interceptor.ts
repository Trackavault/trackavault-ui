import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {filter, first, shareReplay} from 'rxjs/operators';

@Injectable()
class CacheInterceptor implements HttpInterceptor {
  private readonly store: Record<string, Observable<HttpEvent<any>>> = {};

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>{
    if (req.method !== 'GET') {
      return next.handle(req);
    }
    if (req.headers.get('reset')) {
      // this.store.delete(req);
    }
    // Check if observable is in cache, otherwise call next.handle
    const cachedObservable = this.store[req.urlWithParams] ||
      ( this.store[req.urlWithParams] = next.handle(req).pipe(
        // Filter since we are interested in caching the response only, not progress events
        filter((res) => res instanceof HttpResponse ),
        // Share replay will cache the response
        shareReplay(1),
      ));
    // pipe first() to cause the observable to complete after it emits the response
    // This mimics the behaviour of Observables returned by Angular's httpClient.get()
    // And also makes toPromise work since toPromise will wait until the observable completes.
    return cachedObservable.pipe(first());
  }
}

export {CacheInterceptor};
