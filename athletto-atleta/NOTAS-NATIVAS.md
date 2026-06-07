# Notas de configuração nativa

## image_cropper (UCrop) — Android

O plugin `image_cropper` usa a biblioteca UCrop, que exige o registro de uma
activity no `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`:

```xml
<activity
    android:name="com.yalantis.ucrop.UCropActivity"
    android:screenOrientation="portrait"
    android:theme="@style/Theme.AppCompat.Light.NoActionBar"/>
```

> Status: já adicionada neste projeto (ver `AndroidManifest.xml`).

Se o app não usar tema AppCompat, o build segue funcionando porque a activity
declara o próprio `@style/Theme.AppCompat.Light.NoActionBar`.

## image_picker — iOS (pendente, se for compilar para iOS)

Adicionar ao `ios/Runner/Info.plist`:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Precisamos acessar suas fotos para definir a foto de perfil.</string>
<key>NSCameraUsageDescription</key>
<string>Precisamos da câmera para tirar sua foto de perfil.</string>
```
